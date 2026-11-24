import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { SEED_APPS } from './src/data/seedApps';
import { AppIdea, Continent, Sector } from './src/types/app';
import { ProjectBuild, BuildVersion, BuildMember } from './src/types/builder';
import {
  PublicProfile,
  PortfolioItem,
  ConnectionInvite,
  DirectMessage,
  AvailabilityStatus,
} from './src/types/social';
import { initializeApp as initFirebaseApp } from 'firebase/app';
import {
  getFirestore,
  doc as fsDoc,
  setDoc as fsSetDoc,
  deleteDoc as fsDeleteDoc,
} from 'firebase/firestore';
import dns from 'dns/promises';
import net from 'net';
import { ADMIN_EMAILS, isAdminEmail } from './src/utils/adminAuth';
import { KeepChecklistItem, KeepNote, PlatformSettings } from './src/types/notes';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const app = express();

app.use(express.json({ limit: '10mb' }));

// In-memory store initialized with seed apps
let appsStore: AppIdea[] = [...SEED_APPS];

// Secure Authentication Store with Disk & Memory Persistence
interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  name: string;
  role: string;
  country: string;
  createdAt: string;
  suspended?: boolean;
}

const usersStore: Map<string, StoredUser> = new Map();
const sessionsStore: Map<string, { userId: string; expiresAt: number }> = new Map();

const USERS_FILE = path.join(__dirname, 'data_users.json');
const SESSIONS_FILE = path.join(__dirname, 'data_sessions.json');
const APPS_FILE = path.join(__dirname, 'data_apps.json');
const BUILDS_FILE = path.join(__dirname, 'data_builds.json');
const PROFILES_FILE = path.join(__dirname, 'data_profiles.json');
const INVITATIONS_FILE = path.join(__dirname, 'data_invitations.json');
const MESSAGES_FILE = path.join(__dirname, 'data_messages.json');
const NOTES_FILE = path.join(__dirname, 'data_notes.json');
const SETTINGS_FILE = path.join(__dirname, 'data_settings.json');
let buildsStore: ProjectBuild[] = [];
const profilesStore: Map<string, PublicProfile> = new Map();
let invitationsStore: ConnectionInvite[] = [];
let messagesStore: DirectMessage[] = [];
let notesStore: KeepNote[] = [];
let settingsStore: PlatformSettings = {
  announcementBanner: '',
  maintenanceMode: false,
  allowRegistrations: true,
  allowAIGeneration: true,
};
const passwordResetCodesMap: Map<
  string,
  { codeHash: string; salt: string; expiresAt: number; attempts: number }
> = new Map();
const userSocketsMap: Map<string, Set<WebSocket>> = new Map();
const allSocketsSet: Set<WebSocket> = new Set();

function loadPersistedApps() {
  try {
    if (fs.existsSync(APPS_FILE)) {
      const raw = fs.readFileSync(APPS_FILE, 'utf-8');
      const list: AppIdea[] = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) {
        const map = new Map<string, AppIdea>();
        // First add default African seed apps
        SEED_APPS.forEach((a) => map.set(a.id, a));
        // Only keep persisted apps strictly belonging to Afrique
        list
          .filter((a) => a && a.continent === 'Afrique')
          .forEach((a) => map.set(a.id, a));
        appsStore = Array.from(map.values());
        savePersistedApps();
        console.log(`Loaded ${appsStore.length} persisted African apps from disk.`);
        return;
      }
    }
  } catch (e) {
    console.warn('Could not load data_apps.json:', e);
  }
}

function savePersistedApps() {
  try {
    fs.writeFileSync(APPS_FILE, JSON.stringify(appsStore, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Could not save data_apps.json:', e);
  }
}

let serverDb: any = null;
let firebaseWebApiKey: string | null = null;
try {
  const configFile = path.join(__dirname, 'firebase-applet-config.json');
  if (fs.existsSync(configFile)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    firebaseWebApiKey = firebaseConfig.apiKey || null;
    const fbApp = initFirebaseApp(firebaseConfig, 'novastore-backend');
    serverDb = firebaseConfig.firestoreDatabaseId
      ? getFirestore(fbApp, firebaseConfig.firestoreDatabaseId)
      : getFirestore(fbApp);
    console.log('Server-side Firestore database connected:', firebaseConfig.firestoreDatabaseId);
  }
} catch (e) {
  console.warn('Could not initialize server Firestore client:', e);
}

function loadPersistedBuilds() {
  try {
    if (fs.existsSync(BUILDS_FILE)) {
      const raw = fs.readFileSync(BUILDS_FILE, 'utf-8');
      const list: ProjectBuild[] = JSON.parse(raw);
      if (Array.isArray(list)) {
        buildsStore = list.filter((b) => b && b.id && b.appId && Array.isArray(b.versions));
        console.log(`Loaded ${buildsStore.length} persisted builds from disk.`);
      }
    }
  } catch (e) {
    console.warn('Could not load data_builds.json:', e);
  }
}

function savePersistedBuilds() {
  try {
    fs.writeFileSync(BUILDS_FILE, JSON.stringify(buildsStore, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Could not save data_builds.json:', e);
  }
}

function sanitizeSafeWebUrl(raw?: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString().slice(0, 300);
    }
  } catch {}
  return undefined;
}

function ensurePublicProfileForUser(user: {
  id: string;
  name: string;
  role: string;
  country?: string;
  createdAt?: string;
}): PublicProfile {
  const existing = profilesStore.get(user.id);
  if (existing) {
    return existing;
  }
  const created: PublicProfile = {
    id: user.id,
    name: user.name || 'Membre tomorrow',
    role: user.role || 'Développeur local',
    country: user.country || "Côte d'Ivoire",
    headline: user.role || 'Contributeur tomorrow',
    bio: '',
    skills: [],
    portfolioItems: [],
    availability: 'Ouvert aux collabs',
    updatedAt: user.createdAt || new Date().toISOString(),
  };
  profilesStore.set(user.id, created);
  return created;
}

function loadPersistedProfiles() {
  try {
    if (fs.existsSync(PROFILES_FILE)) {
      const raw = fs.readFileSync(PROFILES_FILE, 'utf-8');
      const list: PublicProfile[] = JSON.parse(raw);
      if (Array.isArray(list)) {
        list.forEach((p) => {
          if (p && p.id && p.name) {
            profilesStore.set(p.id, p);
          }
        });
      }
    }
  } catch (e) {
    console.warn('Could not load data_profiles.json:', e);
  }
  usersStore.forEach((u) => {
    ensurePublicProfileForUser(u);
  });
}

function savePersistedProfiles() {
  try {
    fs.writeFileSync(
      PROFILES_FILE,
      JSON.stringify(Array.from(profilesStore.values()), null, 2),
      'utf-8'
    );
  } catch (e) {
    console.warn('Could not save data_profiles.json:', e);
  }
}

function loadPersistedInvitations() {
  try {
    if (fs.existsSync(INVITATIONS_FILE)) {
      const raw = fs.readFileSync(INVITATIONS_FILE, 'utf-8');
      const list: ConnectionInvite[] = JSON.parse(raw);
      if (Array.isArray(list)) {
        invitationsStore = list.filter((inv) => inv && inv.id && inv.fromUserId && inv.toUserId);
      }
    }
  } catch (e) {
    console.warn('Could not load data_invitations.json:', e);
  }
}

function savePersistedInvitations() {
  try {
    fs.writeFileSync(INVITATIONS_FILE, JSON.stringify(invitationsStore, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Could not save data_invitations.json:', e);
  }
}

function loadPersistedMessages() {
  try {
    if (fs.existsSync(MESSAGES_FILE)) {
      const raw = fs.readFileSync(MESSAGES_FILE, 'utf-8');
      const list: DirectMessage[] = JSON.parse(raw);
      if (Array.isArray(list)) {
        messagesStore = list.filter((m) => m && m.id && m.senderId && m.recipientId && m.text);
      }
    }
  } catch (e) {
    console.warn('Could not load data_messages.json:', e);
  }
}

function savePersistedMessages() {
  try {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messagesStore, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Could not save data_messages.json:', e);
  }
}

function emitSocketToUsers(userIds: string[], event: string, payload: unknown) {
  const frame = JSON.stringify({ event, payload });
  for (const uid of userIds) {
    const sockets = userSocketsMap.get(uid);
    if (!sockets) continue;
    sockets.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(frame);
        } catch {}
      }
    });
  }
}

function emitSocketBroadcast(event: string, payload: unknown) {
  const frame = JSON.stringify({ event, payload });
  allSocketsSet.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(frame);
      } catch {}
    }
  });
}

function emitDailyDropPublished(
  apps: AppIdea[],
  source: 'ai' | 'admin' | 'community'
) {
  const dailyApps = apps.filter((a) => a.isDailyDrop && a.continent === 'Afrique');
  if (dailyApps.length === 0) return;
  emitSocketBroadcast('daily_drop:published', {
    apps: dailyApps,
    publishedAt: new Date().toISOString(),
    source,
  });
}

function makeConversationId(userA: string, userB: string): string {
  return [userA, userB].sort().join('__');
}

function hasAcceptedInviteBetween(userA: string, userB: string): boolean {
  return invitationsStore.some(
    (inv) =>
      inv.status === 'accepted' &&
      ((inv.fromUserId === userA && inv.toUserId === userB) ||
        (inv.fromUserId === userB && inv.toUserId === userA))
  );
}

function loadPersistedNotes() {
  try {
    if (fs.existsSync(NOTES_FILE)) {
      const raw = fs.readFileSync(NOTES_FILE, 'utf-8');
      const list: KeepNote[] = JSON.parse(raw);
      if (Array.isArray(list)) {
        notesStore = list.filter((n) => n && n.id && n.ownerId);
      }
    }
  } catch (e) {
    console.warn('Could not load data_notes.json:', e);
  }
}

function savePersistedNotes() {
  try {
    fs.writeFileSync(NOTES_FILE, JSON.stringify(notesStore, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Could not save data_notes.json:', e);
  }
}

function loadPersistedSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        settingsStore = {
          announcementBanner:
            typeof parsed.announcementBanner === 'string'
              ? parsed.announcementBanner.slice(0, 300)
              : '',
          maintenanceMode: Boolean(parsed.maintenanceMode),
          allowRegistrations:
            parsed.allowRegistrations === undefined ? true : Boolean(parsed.allowRegistrations),
          allowAIGeneration:
            parsed.allowAIGeneration === undefined ? true : Boolean(parsed.allowAIGeneration),
        };
      }
    }
  } catch (e) {
    console.warn('Could not load data_settings.json:', e);
  }
}

function savePersistedSettings() {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settingsStore, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Could not save data_settings.json:', e);
  }
}

async function persistNoteToFirestore(note: KeepNote) {
  if (!serverDb) return;
  try {
    await fsSetDoc(fsDoc(serverDb, 'notes', note.id), note, { merge: true });
  } catch (err) {
    console.warn(`Server Firestore write for note ${note.id} failed:`, err);
  }
}

async function deleteNoteFromFirestoreServer(noteId: string) {
  if (!serverDb) return;
  try {
    await fsDeleteDoc(fsDoc(serverDb, 'notes', noteId));
  } catch (err) {
    console.warn(`Server Firestore delete for note ${noteId} failed:`, err);
  }
}

async function deleteBuildFromFirestoreServer(buildId: string) {
  if (!serverDb) return;
  try {
    await fsDeleteDoc(fsDoc(serverDb, 'builds', buildId));
  } catch (err) {
    console.warn(`Server Firestore delete for build ${buildId} failed:`, err);
  }
}

async function deleteAppFromFirestoreServer(appId: string) {
  if (!serverDb) return;
  try {
    await fsDeleteDoc(fsDoc(serverDb, 'apps', appId));
  } catch (err) {
    console.warn(`Server Firestore delete for app ${appId} failed:`, err);
  }
}

async function persistBuildToFirestore(buildItem: ProjectBuild) {
  if (!serverDb) return;
  try {
    await fsSetDoc(fsDoc(serverDb, 'builds', buildItem.id), buildItem, { merge: true });
  } catch (err) {
    console.warn(`Server Firestore write for build ${buildItem.id} failed:`, err);
  }
}

async function persistAppToFirestore(appItem: AppIdea) {
  if (!serverDb) return;
  try {
    await fsSetDoc(fsDoc(serverDb, 'apps', appItem.id), appItem, { merge: true });
  } catch (err) {
    console.warn(`Server Firestore write for app ${appItem.id} failed:`, err);
  }
}

async function persistMultipleAppsToFirestore(appsList: AppIdea[]) {
  if (!serverDb) return;
  try {
    await Promise.all(appsList.map((a) => fsSetDoc(fsDoc(serverDb, 'apps', a.id), a, { merge: true })));
  } catch (err) {
    console.warn('Server Firestore write for multiple apps failed:', err);
  }
}

function loadPersistedUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf-8');
      const list: StoredUser[] = JSON.parse(raw);
      list.forEach((u) => usersStore.set(u.id, u));
      console.log(`Loaded ${list.length} persisted users from disk.`);
    }
  } catch (e) {
    console.warn('Could not load data_users.json:', e);
  }
}

function savePersistedUsers() {
  try {
    const list = Array.from(usersStore.values());
    fs.writeFileSync(USERS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Could not save data_users.json:', e);
  }
}

function loadPersistedSessions() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const raw = fs.readFileSync(SESSIONS_FILE, 'utf-8');
      const entries: [string, { userId: string; expiresAt: number }][] = JSON.parse(raw);
      entries.forEach(([token, data]) => {
        if (data.expiresAt > Date.now()) {
          sessionsStore.set(token, data);
        }
      });
      console.log(`Loaded ${sessionsStore.size} active sessions from disk.`);
    }
  } catch (e) {
    console.warn('Could not load data_sessions.json:', e);
  }
}

function savePersistedSessions() {
  try {
    const entries = Array.from(sessionsStore.entries());
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(entries, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Could not save data_sessions.json:', e);
  }
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  const hash = hashPassword(password, salt);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(storedHash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function getBearerToken(req: express.Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1].trim();
}

function hashOtpCode(code: string, salt: string): string {
  return crypto.createHash('sha256').update(`${salt}:${code}`).digest('hex');
}

function createPasswordResetOtp(email: string): { code: string; expiresAt: number } {
  const cleanEmail = email.trim().toLowerCase();
  const code = crypto.randomInt(100000, 1000000).toString();
  const salt = crypto.randomBytes(16).toString('hex');
  const expiresAt = Date.now() + 15 * 60 * 1000;
  passwordResetCodesMap.set(cleanEmail, {
    codeHash: hashOtpCode(code, salt),
    salt,
    expiresAt,
    attempts: 0,
  });
  return { code, expiresAt };
}

function verifyPasswordResetOtp(
  email: string,
  code: string
): { valid: boolean; reason?: string } {
  const cleanEmail = email.trim().toLowerCase();
  const entry = passwordResetCodesMap.get(cleanEmail);
  if (!entry) {
    return { valid: false, reason: 'Aucune demande de code active pour cet email.' };
  }
  if (Date.now() > entry.expiresAt) {
    passwordResetCodesMap.delete(cleanEmail);
    return { valid: false, reason: 'Ce code de récupération a expiré (validité 15 min).' };
  }
  if (entry.attempts >= 5) {
    passwordResetCodesMap.delete(cleanEmail);
    return { valid: false, reason: 'Trop de tentatives erronées. Demandez un nouveau code.' };
  }

  const candidateHash = hashOtpCode(code.trim(), entry.salt);
  const a = Buffer.from(candidateHash, 'hex');
  const b = Buffer.from(entry.codeHash, 'hex');
  const match = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!match) {
    entry.attempts += 1;
    if (entry.attempts >= 5) {
      passwordResetCodesMap.delete(cleanEmail);
    }
    return { valid: false, reason: 'Code de récupération incorrect.' };
  }

  passwordResetCodesMap.delete(cleanEmail);
  return { valid: true };
}

function revokeUserSessions(userId: string) {
  let changed = false;
  for (const [tok, sess] of sessionsStore.entries()) {
    if (sess.userId === userId) {
      sessionsStore.delete(tok);
      changed = true;
    }
  }
  if (changed) savePersistedSessions();
}

function findUserByEmail(email: string): StoredUser | null {
  const cleanEmail = email.trim().toLowerCase();
  for (const u of usersStore.values()) {
    if (u.email.toLowerCase() === cleanEmail) return u;
  }
  return null;
}

function getUserByToken(token: string | null): StoredUser | null {
  if (!token) return null;
  const session = sessionsStore.get(token);
  if (session) {
    if (Date.now() > session.expiresAt) {
      sessionsStore.delete(token);
      savePersistedSessions();
      return null;
    }
    const u = usersStore.get(session.userId) || null;
    if (u?.suspended) return null;
    return u;
  }

  // Check if token matches a direct userId
  if (usersStore.has(token)) {
    const u = usersStore.get(token) || null;
    if (u?.suspended) return null;
    return u;
  }

  return null;
}

const firebaseTokenCache: Map<string, { user: StoredUser; expiresAt: number }> = new Map();

async function resolveUserByToken(token: string | null): Promise<StoredUser | null> {
  const localUser = getUserByToken(token);
  if (localUser) return localUser;

  if (!token || token.split('.').length !== 3 || !firebaseWebApiKey) {
    return null;
  }

  const cached = firebaseTokenCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    const localRecord = findUserByEmail(cached.user.email);
    if (localRecord?.suspended) return null;
    return cached.user;
  }

  try {
    const resp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseWebApiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
      }
    );
    if (!resp.ok) return null;
    const data = (await resp.json()) as any;
    const fbAccount = data?.users?.[0];
    if (!fbAccount || !fbAccount.localId) return null;

    const email = String(fbAccount.email || '').toLowerCase();
    const localRecord = email ? findUserByEmail(email) : null;
    if (localRecord?.suspended) return null;

    const isAdmin = isAdminEmail(email);
    const resolved: StoredUser = {
      id: fbAccount.localId,
      email,
      passwordHash: '',
      salt: '',
      name: fbAccount.displayName || localRecord?.name || (email ? email.split('@')[0] : 'Membre'),
      role: isAdmin ? 'Administrateur' : localRecord?.role || 'Développeur local',
      country: localRecord?.country || "Côte d'Ivoire",
      createdAt: localRecord?.createdAt || new Date().toISOString(),
    };
    firebaseTokenCache.set(token, { user: resolved, expiresAt: Date.now() + 5 * 60 * 1000 });
    ensurePublicProfileForUser(resolved);
    return resolved;
  } catch {
    return null;
  }
}

// Primary Admin email reference
const PRIMARY_ADMIN_EMAIL = ADMIN_EMAILS[0];

// Pre-seed primary Admin account only if not already present on disk
const adminSalt = crypto.randomBytes(16).toString('hex');
const adminUser: StoredUser = {
  id: 'usr-admin-jonathan',
  email: PRIMARY_ADMIN_EMAIL.toLowerCase(),
  salt: adminSalt,
  passwordHash: hashPassword('admin123456', adminSalt),
  name: 'Jonathan (Administrateur)',
  role: 'Administrateur',
  country: "Côte d'Ivoire",
  createdAt: new Date().toISOString(),
};
usersStore.set(adminUser.id, adminUser);

// Load persisted accounts, sessions, catalog & social data from disk
loadPersistedUsers();
loadPersistedSessions();
loadPersistedApps();
loadPersistedBuilds();
loadPersistedProfiles();
loadPersistedInvitations();
loadPersistedMessages();
loadPersistedNotes();
loadPersistedSettings();
if (!fs.existsSync(APPS_FILE)) {
  savePersistedApps();
}
if (!fs.existsSync(BUILDS_FILE)) {
  savePersistedBuilds();
}
if (!fs.existsSync(PROFILES_FILE)) {
  savePersistedProfiles();
}
if (!fs.existsSync(NOTES_FILE)) {
  savePersistedNotes();
}
if (!fs.existsSync(SETTINGS_FILE)) {
  savePersistedSettings();
}

// Admin protection middleware (jonatha2ngs@gmail.com & lumanegrah88@gmail.com)
async function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = getBearerToken(req);
  const user = await resolveUserByToken(token);
  if (!user || !isAdminEmail(user.email)) {
    return res.status(403).json({
      success: false,
      error: 'Accès interdit : cet espace administratif est réservé aux administrateurs habilités.',
    });
  }
  (req as any).user = user;
  next();
}

// User authentication required middleware (visitors must register/login to like, comment, pledge, or submit)
async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = getBearerToken(req);
  const user = await resolveUserByToken(token);
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Veuillez vous inscrire ou vous connecter pour participer (liker, commenter ou contribuer).',
    });
  }
  (req as any).user = user;
  next();
}

// Initialize Gemini SDK if API key is present
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// ================= AUTH ROUTES =================

// Register
app.post('/api/auth/register', (req, res) => {
  const { email, password, name, role = 'Citoyen / Usager', country = "Côte d'Ivoire" } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ success: false, error: 'Email, mot de passe et nom requis.' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  if (cleanEmail.length < 5 || !cleanEmail.includes('@')) {
    return res.status(400).json({ success: false, error: 'Format d\'adresse email invalide.' });
  }

  if (!settingsStore.allowRegistrations && !isAdminEmail(cleanEmail)) {
    return res.status(403).json({
      success: false,
      error: 'Les nouvelles inscriptions sont temporairement suspendues par l\'administration.',
    });
  }

  if (String(password).length < 6) {
    return res.status(400).json({ success: false, error: 'Le mot de passe doit comporter au moins 6 caractères.' });
  }

  for (const user of usersStore.values()) {
    if (user.email.toLowerCase() === cleanEmail) {
      return res.status(409).json({ success: false, error: 'Un compte existe déjà avec cette adresse email.' });
    }
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(String(password), salt);
  const isAdmin = isAdminEmail(cleanEmail);
  const newUser: StoredUser = {
    id: `usr-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    email: cleanEmail,
    passwordHash,
    salt,
    name: String(name).trim(),
    role: isAdmin ? 'Administrateur' : String(role).trim(),
    country: String(country).trim(),
    createdAt: new Date().toISOString(),
  };

  usersStore.set(newUser.id, newUser);
  savePersistedUsers();
  ensurePublicProfileForUser(newUser);
  savePersistedProfiles();

  const token = crypto.randomBytes(32).toString('hex');
  sessionsStore.set(token, {
    userId: newUser.id,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
  });
  savePersistedSessions();

  return res.json({
    success: true,
    token,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      country: newUser.country,
      createdAt: newUser.createdAt,
      isAdmin,
    },
  });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email et mot de passe requis.' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const foundUser = findUserByEmail(cleanEmail);

  if (!foundUser || !verifyPassword(String(password), foundUser.salt, foundUser.passwordHash)) {
    return res.status(401).json({ success: false, error: 'Identifiants invalides. Vérifiez votre email et mot de passe.' });
  }

  if (foundUser.suspended) {
    return res.status(403).json({
      success: false,
      error: 'Ce compte a été suspendu par un administrateur.',
    });
  }

  const token = crypto.randomBytes(32).toString('hex');
  sessionsStore.set(token, {
    userId: foundUser.id,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
  });
  savePersistedSessions();

  const isAdmin = isAdminEmail(foundUser.email);

  return res.json({
    success: true,
    token,
    user: {
      id: foundUser.id,
      email: foundUser.email,
      name: foundUser.name,
      role: isAdmin ? 'Administrateur' : foundUser.role,
      country: foundUser.country,
      createdAt: foundUser.createdAt,
      isAdmin,
    },
  });
});

// Password Recovery Step 1: Request reset (never exposes OTP in unauthenticated HTTP response)
app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body || {};
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return res.status(400).json({ success: false, error: 'Adresse email valide requise.' });
  }

  const foundUser = findUserByEmail(cleanEmail);
  if (foundUser && !foundUser.suspended) {
    createPasswordResetOtp(cleanEmail);
  }

  return res.json({
    success: true,
    message:
      "Si un compte est enregistré avec cet email, consultez votre boîte mail (lien Firebase) ou saisissez le code de récupération à 6 chiffres fourni par l'administration.",
  });
});

// Password Recovery Step 2: Verify 6-digit OTP & set new password
app.post('/api/auth/reset-password', (req, res) => {
  const { email, code, newPassword } = req.body || {};
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const cleanCode = typeof code === 'string' ? code.trim() : '';
  const cleanPassword = typeof newPassword === 'string' ? newPassword : '';

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return res.status(400).json({ success: false, error: 'Adresse email invalide.' });
  }
  if (!/^\d{6}$/.test(cleanCode)) {
    return res.status(400).json({ success: false, error: 'Le code de récupération doit contenir 6 chiffres.' });
  }
  if (cleanPassword.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Le nouveau mot de passe doit comporter au moins 6 caractères.',
    });
  }

  const otpCheck = verifyPasswordResetOtp(cleanEmail, cleanCode);
  if (!otpCheck.valid) {
    return res.status(400).json({ success: false, error: otpCheck.reason || 'Code invalide.' });
  }

  const foundUser = findUserByEmail(cleanEmail);
  if (!foundUser) {
    return res.status(404).json({ success: false, error: 'Compte introuvable pour cet email.' });
  }
  if (foundUser.suspended) {
    return res.status(403).json({ success: false, error: 'Ce compte est suspendu.' });
  }

  const freshSalt = crypto.randomBytes(16).toString('hex');
  foundUser.salt = freshSalt;
  foundUser.passwordHash = hashPassword(cleanPassword, freshSalt);
  usersStore.set(foundUser.id, foundUser);
  savePersistedUsers();

  revokeUserSessions(foundUser.id);
  const token = crypto.randomBytes(32).toString('hex');
  sessionsStore.set(token, {
    userId: foundUser.id,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
  });
  savePersistedSessions();

  const isAdmin = isAdminEmail(foundUser.email);

  return res.json({
    success: true,
    token,
    user: {
      id: foundUser.id,
      email: foundUser.email,
      name: foundUser.name,
      role: isAdmin ? 'Administrateur' : foundUser.role,
      country: foundUser.country,
      createdAt: foundUser.createdAt,
      isAdmin,
    },
    message: 'Mot de passe réinitialisé avec succès.',
  });
});

// Get current authenticated user
app.get('/api/auth/me', async (req, res) => {
  const token = getBearerToken(req);
  const user = await resolveUserByToken(token);

  if (!user) {
    return res.status(401).json({ success: false, error: 'Session expirée ou non authentifiée.' });
  }

  const isAdmin = isAdminEmail(user.email);

  return res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: isAdmin ? 'Administrateur' : user.role,
      country: user.country,
      createdAt: user.createdAt,
      isAdmin,
    },
  });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  const token = getBearerToken(req);
  if (token) {
    sessionsStore.delete(token);
    savePersistedSessions();
  }
  return res.json({ success: true, message: 'Déconnexion réussie.' });
});

// ================= PUBLIC PLATFORM SETTINGS =================

app.get('/api/platform-settings', (_req, res) => {
  return res.json({ success: true, settings: settingsStore });
});

// ================= GOOGLE KEEP COMPATIBLE NOTES & CHECKLISTS =================

app.get('/api/notes', requireAuth, (req, res) => {
  const user = (req as any).user as StoredUser;
  const mine = notesStore
    .filter((n) => n.ownerId === user.id)
    .sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) ||
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  return res.json({ success: true, notes: mine });
});

app.post('/api/notes', requireAuth, (req, res) => {
  const user = (req as any).user as StoredUser;
  const body = req.body || {};

  const title = typeof body.title === 'string' ? body.title.trim().slice(0, 160) : '';
  const textBody = typeof body.body === 'string' ? body.body.slice(0, 5000) : '';
  const isChecklist = Boolean(body.isChecklist);
  const checklistItems: KeepChecklistItem[] = Array.isArray(body.checklistItems)
    ? body.checklistItems
        .filter((it: any) => it && typeof it.text === 'string' && it.text.trim())
        .slice(0, 60)
        .map((it: any, idx: number) => ({
          id:
            typeof it.id === 'string' && it.id.trim()
              ? it.id.trim().slice(0, 64)
              : `chk-${Date.now()}-${idx}`,
          text: String(it.text).trim().slice(0, 200),
          checked: Boolean(it.checked),
        }))
    : [];

  if (!title && !textBody.trim() && checklistItems.length === 0) {
    return res.status(400).json({ success: false, error: 'Contenu de note requis.' });
  }

  const allowedSources = ['local', 'takeout', 'google_keep_api'];
  const source = allowedSources.includes(body.source) ? body.source : 'local';

  const newNote: KeepNote = {
    id: `note-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    ownerId: user.id,
    title: title || 'Note sans titre',
    body: textBody,
    isChecklist,
    checklistItems,
    pinned: Boolean(body.pinned),
    linkedAppId:
      typeof body.linkedAppId === 'string' && body.linkedAppId.trim()
        ? body.linkedAppId.trim().slice(0, 80)
        : undefined,
    linkedAppTitle:
      typeof body.linkedAppTitle === 'string' && body.linkedAppTitle.trim()
        ? body.linkedAppTitle.trim().slice(0, 140)
        : undefined,
    source,
    updatedAt: new Date().toISOString(),
  };

  notesStore.unshift(newNote);
  savePersistedNotes();
  persistNoteToFirestore(newNote);

  return res.json({ success: true, note: newNote });
});

app.patch('/api/notes/:id', requireAuth, (req, res) => {
  const user = (req as any).user as StoredUser;
  const { id } = req.params;
  const idx = notesStore.findIndex((n) => n.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Note introuvable.' });
  }

  const existing = notesStore[idx];
  if (existing.ownerId !== user.id) {
    return res.status(403).json({ success: false, error: 'Accès interdit à cette note.' });
  }

  const body = req.body || {};
  const updated: KeepNote = {
    ...existing,
    title:
      typeof body.title === 'string'
        ? body.title.trim().slice(0, 160) || 'Note sans titre'
        : existing.title,
    body: typeof body.body === 'string' ? body.body.slice(0, 5000) : existing.body,
    isChecklist:
      body.isChecklist !== undefined ? Boolean(body.isChecklist) : existing.isChecklist,
    checklistItems: Array.isArray(body.checklistItems)
      ? body.checklistItems
          .filter((it: any) => it && typeof it.text === 'string' && it.text.trim())
          .slice(0, 60)
          .map((it: any, i: number) => ({
            id:
              typeof it.id === 'string' && it.id.trim()
                ? it.id.trim().slice(0, 64)
                : `chk-${Date.now()}-${i}`,
            text: String(it.text).trim().slice(0, 200),
            checked: Boolean(it.checked),
          }))
      : existing.checklistItems,
    pinned: body.pinned !== undefined ? Boolean(body.pinned) : existing.pinned,
    updatedAt: new Date().toISOString(),
  };

  notesStore[idx] = updated;
  savePersistedNotes();
  persistNoteToFirestore(updated);

  return res.json({ success: true, note: updated });
});

app.delete('/api/notes/:id', requireAuth, (req, res) => {
  const user = (req as any).user as StoredUser;
  const { id } = req.params;
  const existing = notesStore.find((n) => n.id === id);
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Note introuvable.' });
  }
  if (existing.ownerId !== user.id) {
    return res.status(403).json({ success: false, error: 'Accès interdit à cette note.' });
  }

  notesStore = notesStore.filter((n) => n.id !== id);
  savePersistedNotes();
  deleteNoteFromFirestoreServer(id);

  return res.json({ success: true, removedId: id });
});

// ================= ADMIN ROUTES (jonatha2ngs@gmail.com & lumanegrah88@gmail.com) =================

// Admin Overview & Full Platform Data
app.get('/api/admin/overview', requireAdmin, (_req, res) => {
  const totalApps = appsStore.length;
  const dailyApps = appsStore.filter((a) => a.isDailyDrop).length;
  const totalVotes = appsStore.reduce((sum, a) => sum + (a.votes || 0), 0);

  const allPledges: any[] = [];
  const allComments: any[] = [];
  appsStore.forEach((a) => {
    (a.devPledges || []).forEach((p) => {
      allPledges.push({
        ...p,
        appId: a.id,
        appTitle: a.title,
        appCountry: a.country,
      });
    });
    (a.comments || []).forEach((c) => {
      allComments.push({
        ...c,
        appId: a.id,
        appTitle: a.title,
        appCountry: a.country,
      });
    });
  });

  const sanitizedUsers = Array.from(usersStore.values()).map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: isAdminEmail(u.email) ? 'Administrateur' : u.role,
    country: u.country,
    createdAt: u.createdAt,
    suspended: Boolean(u.suspended),
    isAdmin: isAdminEmail(u.email),
  }));

  return res.json({
    success: true,
    stats: {
      totalApps,
      dailyApps,
      totalVotes,
      totalPledges: allPledges.length,
      totalUsers: sanitizedUsers.length,
      totalBuilds: buildsStore.length,
      totalComments: allComments.length,
      totalProfiles: profilesStore.size,
      totalInvitations: invitationsStore.length,
      totalMessages: messagesStore.length,
    },
    apps: appsStore,
    users: sanitizedUsers,
    pledges: allPledges,
    builds: buildsStore,
    comments: allComments,
    settings: settingsStore,
  });
});

// Admin Update Global Platform Settings
app.patch('/api/admin/settings', requireAdmin, (req, res) => {
  const body = req.body || {};
  settingsStore = {
    announcementBanner:
      typeof body.announcementBanner === 'string'
        ? body.announcementBanner.trim().slice(0, 300)
        : settingsStore.announcementBanner,
    maintenanceMode:
      body.maintenanceMode !== undefined
        ? Boolean(body.maintenanceMode)
        : settingsStore.maintenanceMode,
    allowRegistrations:
      body.allowRegistrations !== undefined
        ? Boolean(body.allowRegistrations)
        : settingsStore.allowRegistrations,
    allowAIGeneration:
      body.allowAIGeneration !== undefined
        ? Boolean(body.allowAIGeneration)
        : settingsStore.allowAIGeneration,
  };
  savePersistedSettings();
  return res.json({ success: true, settings: settingsStore });
});

// Admin Create App directly
app.post('/api/admin/apps', requireAdmin, (req, res) => {
  const user = (req as any).user as StoredUser;
  const data = req.body || {};
  if (!data.title || !data.problemSolved || !data.country) {
    return res.status(400).json({ success: false, error: 'Titre, pays et problème résolu requis.' });
  }

  const resolvedCode = (data.countryCode || getCountryIsoCode(data.country) || 'AF').toUpperCase();
  const newApp: AppIdea = {
    id: `adm-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    title: String(data.title).trim().slice(0, 120),
    tagline: String(data.tagline || data.title).trim().slice(0, 200),
    description: String(data.description || data.problemSolved).trim().slice(0, 2000),
    icon: data.icon || 'Africa',
    gradient: 'bg-black',
    continent: 'Afrique',
    country: String(data.country).trim(),
    countryCode: resolvedCode,
    flag: resolvedCode,
    sector: data.sector || 'Citoyenneté & Droits',
    targetAudience: String(data.targetAudience || 'Citoyens et acteurs locaux').trim(),
    problemSolved: String(data.problemSolved).trim(),
    impactPotential: String(data.impactPotential || 'Impact communautaire direct').trim(),
    techStackSuggested:
      Array.isArray(data.techStackSuggested) && data.techStackSuggested.length > 0
        ? data.techStackSuggested
        : ['React', 'Node.js', 'PWA Offline'],
    difficulty: data.difficulty || 'Accessible',
    status: data.status || 'Recherche Développeurs',
    votes: 0,
    isDailyDrop: Boolean(data.isDailyDrop),
    dailyDropDate: data.isDailyDrop ? new Date().toISOString().split('T')[0] : undefined,
    createdAt: new Date().toISOString(),
    authorEmail: user.email,
    authorName: user.name,
    devPledges: [],
    comments: [],
    developerBrief: {
      mvpScope: ['Interface mobile responsive', 'Mode hors-ligne', 'API sécurisée'],
      localConstraints: ['Connexion 2G/3G intermittente', 'Support multi-langue'],
      monetization: 'Modèle solidaire ou subvention',
      openSourceFriendly: true,
      architecturalTip: 'Prioriser la légèreté et l\'accessibilité mobile.',
    },
  };

  appsStore.unshift(newApp);
  savePersistedApps();
  persistAppToFirestore(newApp);
  if (newApp.isDailyDrop) {
    emitDailyDropPublished([newApp], 'admin');
  }
  return res.json({ success: true, app: newApp });
});

// Admin Update App
app.patch('/api/admin/apps/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const appIndex = appsStore.findIndex((a) => a.id === id);
  if (appIndex === -1) {
    return res.status(404).json({ success: false, error: 'Application introuvable' });
  }

  const prevWasDaily = Boolean(appsStore[appIndex].isDailyDrop);
  const updates = req.body || {};
  appsStore[appIndex] = {
    ...appsStore[appIndex],
    ...updates,
    dailyDropDate:
      updates.isDailyDrop === true && !appsStore[appIndex].dailyDropDate && !updates.dailyDropDate
        ? new Date().toISOString().split('T')[0]
        : updates.dailyDropDate ?? appsStore[appIndex].dailyDropDate,
  };
  savePersistedApps();
  persistAppToFirestore(appsStore[appIndex]);

  if (!prevWasDaily && Boolean(appsStore[appIndex].isDailyDrop)) {
    emitDailyDropPublished([appsStore[appIndex]], 'admin');
  }

  return res.json({ success: true, app: appsStore[appIndex] });
});

// Admin Delete App (fixed persistence)
app.delete('/api/admin/apps/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const initialLength = appsStore.length;
  appsStore = appsStore.filter((a) => a.id !== id);

  if (appsStore.length === initialLength) {
    return res.status(404).json({ success: false, error: 'Application introuvable' });
  }

  savePersistedApps();
  deleteAppFromFirestoreServer(id);
  return res.json({ success: true, message: 'Application supprimée définitivement.' });
});

// Admin Delete Dev Pledge (fixed persistence)
app.delete('/api/admin/pledges/:appId/:pledgeId', requireAdmin, (req, res) => {
  const { appId, pledgeId } = req.params;
  const appItem = appsStore.find((a) => a.id === appId);
  if (!appItem) {
    return res.status(404).json({ success: false, error: 'Application introuvable' });
  }

  appItem.devPledges = (appItem.devPledges || []).filter((p) => p.id !== pledgeId);
  savePersistedApps();
  persistAppToFirestore(appItem);
  return res.json({ success: true, message: 'Engagement développeur retiré.' });
});

// Admin Delete Community Comment
app.delete('/api/admin/comments/:appId/:commentId', requireAdmin, (req, res) => {
  const { appId, commentId } = req.params;
  const appItem = appsStore.find((a) => a.id === appId);
  if (!appItem) {
    return res.status(404).json({ success: false, error: 'Application introuvable' });
  }

  const before = (appItem.comments || []).length;
  appItem.comments = (appItem.comments || []).filter((c) => c.id !== commentId);
  if (appItem.comments.length === before) {
    return res.status(404).json({ success: false, error: 'Commentaire introuvable.' });
  }

  savePersistedApps();
  persistAppToFirestore(appItem);
  return res.json({ success: true, message: 'Commentaire modéré et supprimé.' });
});

// Admin Update Collaborative Build
app.patch('/api/admin/builds/:buildId', requireAdmin, (req, res) => {
  const { buildId } = req.params;
  const idx = buildsStore.findIndex((b) => b.id === buildId);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Build introuvable.' });
  }

  const body = req.body || {};
  const allowedStages = ['Concept', 'Prototype', 'Alpha', 'Beta', 'Production'];
  const build = buildsStore[idx];
  buildsStore[idx] = {
    ...build,
    isPublic: body.isPublic !== undefined ? Boolean(body.isPublic) : build.isPublic,
    progressStage:
      body.progressStage && allowedStages.includes(body.progressStage)
        ? body.progressStage
        : build.progressStage,
    progressPercent:
      typeof body.progressPercent === 'number'
        ? Math.min(100, Math.max(0, body.progressPercent))
        : build.progressPercent,
    title:
      typeof body.title === 'string' && body.title.trim()
        ? body.title.trim().slice(0, 140)
        : build.title,
    updatedAt: new Date().toISOString(),
  };

  savePersistedBuilds();
  persistBuildToFirestore(buildsStore[idx]);
  return res.json({ success: true, build: buildsStore[idx] });
});

// Admin Delete Collaborative Build
app.delete('/api/admin/builds/:buildId', requireAdmin, (req, res) => {
  const { buildId } = req.params;
  const before = buildsStore.length;
  buildsStore = buildsStore.filter((b) => b.id !== buildId);
  if (buildsStore.length === before) {
    return res.status(404).json({ success: false, error: 'Build introuvable.' });
  }

  savePersistedBuilds();
  deleteBuildFromFirestoreServer(buildId);
  return res.json({ success: true, message: 'Build supprimé définitivement.' });
});

// Admin Update User (role / suspension)
app.patch('/api/admin/users/:userId', requireAdmin, (req, res) => {
  const { userId } = req.params;
  const target = usersStore.get(userId);
  if (!target) {
    return res.status(404).json({ success: false, error: 'Utilisateur introuvable' });
  }

  const targetIsAdmin = isAdminEmail(target.email);
  const body = req.body || {};

  if (body.suspended !== undefined) {
    if (targetIsAdmin && Boolean(body.suspended)) {
      return res.status(400).json({
        success: false,
        error: 'Impossible de suspendre un compte Super Administrateur.',
      });
    }
    target.suspended = Boolean(body.suspended);
    if (target.suspended) {
      revokeUserSessions(target.id);
    }
  }

  if (typeof body.role === 'string' && body.role.trim() && !targetIsAdmin) {
    target.role = body.role.trim().slice(0, 80);
    const prof = profilesStore.get(target.id);
    if (prof) {
      prof.role = target.role;
      profilesStore.set(target.id, prof);
      savePersistedProfiles();
    }
  }

  usersStore.set(target.id, target);
  savePersistedUsers();

  return res.json({
    success: true,
    user: {
      id: target.id,
      email: target.email,
      name: target.name,
      role: targetIsAdmin ? 'Administrateur' : target.role,
      country: target.country,
      createdAt: target.createdAt,
      suspended: Boolean(target.suspended),
      isAdmin: targetIsAdmin,
    },
  });
});

// Admin Issue 6-digit Password Recovery Code for a User (Super Admin only)
app.post('/api/admin/users/:userId/reset-code', requireAdmin, (req, res) => {
  const { userId } = req.params;
  const target = usersStore.get(userId);
  if (!target) {
    return res.status(404).json({ success: false, error: 'Utilisateur introuvable' });
  }

  const { code, expiresAt } = createPasswordResetOtp(target.email);
  return res.json({
    success: true,
    email: target.email,
    code,
    expiresAt,
  });
});

// Admin Delete User (fixed persistence + protects all super admins)
app.delete('/api/admin/users/:userId', requireAdmin, (req, res) => {
  const { userId } = req.params;
  const target = usersStore.get(userId);
  if (!target) {
    return res.status(404).json({ success: false, error: 'Utilisateur introuvable' });
  }

  if (isAdminEmail(target.email)) {
    return res.status(400).json({ success: false, error: 'Impossible de supprimer un compte administrateur.' });
  }

  usersStore.delete(userId);
  savePersistedUsers();
  if (profilesStore.delete(userId)) {
    savePersistedProfiles();
  }
  revokeUserSessions(userId);
  return res.json({ success: true, message: 'Compte utilisateur supprimé.' });
});

// ================= APP STORE ROUTES =================

// 1. Get all apps (Afrique uniquement)
app.get('/api/apps', (req, res) => {
  const { sector, query, sort } = req.query;

  let results = appsStore.filter((a) => a.continent === 'Afrique');

  if (sector && sector !== 'Tous') {
    results = results.filter(
      (a) => a.sector.toLowerCase() === String(sector).toLowerCase()
    );
  }

  if (query) {
    const q = String(query).toLowerCase().trim();
    results = results.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.tagline.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.country.toLowerCase().includes(q) ||
        a.problemSolved.toLowerCase().includes(q) ||
        a.techStackSuggested.some((t) => t.toLowerCase().includes(q))
    );
  }

  if (sort === 'votes') {
    results.sort((a, b) => b.votes - a.votes);
  } else if (sort === 'daily') {
    results = results.filter((a) => a.isDailyDrop);
  } else {
    // default: newest or daily first then votes
    results.sort((a, b) => {
      if (a.isDailyDrop && !b.isDailyDrop) return -1;
      if (!a.isDailyDrop && b.isDailyDrop) return 1;
      return b.votes - a.votes;
    });
  }

  res.json({ success: true, count: results.length, apps: results });
});

// 2. Get today's 4 AI drop apps (Afrique uniquement)
app.get('/api/daily-drop', (req, res) => {
  const dailyApps = appsStore.filter((a) => a.isDailyDrop && a.continent === 'Afrique');
  res.json({
    success: true,
    date: new Date().toISOString().split('T')[0],
    apps: dailyApps.slice(0, 4),
  });
});

// 3. Vote for an app (Requires authentication)
app.post('/api/apps/:id/vote', requireAuth, (req, res) => {
  const { id } = req.params;
  const { delta = 1 } = req.body;

  const appIndex = appsStore.findIndex((a) => a.id === id);
  if (appIndex === -1) {
    return res.status(404).json({ success: false, error: 'App introuvable' });
  }

  appsStore[appIndex].votes = Math.max(0, appsStore[appIndex].votes + (Number(delta) || 1));
  savePersistedApps();
  persistAppToFirestore(appsStore[appIndex]);
  res.json({ success: true, app: appsStore[appIndex] });
});

// 4. Developer pledge ("Je veux développer cette application", requires authentication)
app.post('/api/apps/:id/pledge', requireAuth, (req, res) => {
  const { id } = req.params;
  const { name, role, country, githubOrContact, comment, userEmail } = req.body;

  if (!name || !role) {
    return res.status(400).json({ success: false, error: 'Nom et rôle requis' });
  }

  const appIndex = appsStore.findIndex((a) => a.id === id);
  if (appIndex === -1) {
    return res.status(404).json({ success: false, error: 'App introuvable' });
  }

  const tokenUser = (req as any).user;

  const newPledge = {
    id: `pledge-${Date.now()}`,
    name: name || tokenUser.name,
    role: role || tokenUser.role,
    country: country || tokenUser.country || appsStore[appIndex].country,
    githubOrContact: githubOrContact || '',
    comment: comment || 'Prêt(e) à contribuer au développement de cette solution !',
    createdAt: new Date().toISOString(),
    userEmail: userEmail || tokenUser.email,
  };

  appsStore[appIndex].devPledges.unshift(newPledge);
  if (appsStore[appIndex].status === 'Recherche Développeurs' || appsStore[appIndex].status === 'Idée IA du Jour') {
    appsStore[appIndex].status = 'Prototypage en cours';
  }

  savePersistedApps();
  persistAppToFirestore(appsStore[appIndex]);
  res.json({ success: true, app: appsStore[appIndex], pledge: newPledge });
});

// 5. Add community comment (Requires authentication)
app.post('/api/apps/:id/comment', requireAuth, (req, res) => {
  const { id } = req.params;
  const { text } = req.body;

  if (!text || !String(text).trim()) {
    return res.status(400).json({ success: false, error: 'Commentaire requis' });
  }

  const appIndex = appsStore.findIndex((a) => a.id === id);
  if (appIndex === -1) {
    return res.status(404).json({ success: false, error: 'App introuvable' });
  }

  const tokenUser = (req as any).user;

  const newComment = {
    id: `comment-${Date.now()}`,
    author: tokenUser.name,
    role: tokenUser.role || 'Citoyen engagé',
    text: String(text).trim(),
    createdAt: new Date().toISOString(),
  };

  appsStore[appIndex].comments.push(newComment);
  savePersistedApps();
  persistAppToFirestore(appsStore[appIndex]);
  res.json({ success: true, app: appsStore[appIndex], comment: newComment });
});

// 6. Propose a community idea (Requires authentication)
app.post('/api/apps/submit', requireAuth, (req, res) => {
  const data = req.body;
  if (!data.title || !data.problemSolved || !data.country) {
    return res.status(400).json({ success: false, error: 'Champs essentiels manquants' });
  }

  const tokenUser = (req as any).user;

  const resolvedCode = (data.countryCode || getCountryIsoCode(data.country) || 'AF').toUpperCase();

  const newApp: AppIdea = {
    id: `user-${Date.now()}`,
    title: data.title,
    tagline: data.tagline || data.title,
    description: data.description || data.problemSolved,
    icon: data.icon || 'Africa',
    gradient: 'bg-black',
    continent: 'Afrique',
    country: data.country,
    countryCode: resolvedCode,
    flag: resolvedCode,
    sector: data.sector || 'Citoyenneté & Droits',
    targetAudience: data.targetAudience || 'Citoyens et acteurs locaux',
    problemSolved: data.problemSolved,
    impactPotential: data.impactPotential || 'Impact communautaire direct',
    techStackSuggested: data.techStackSuggested?.length ? data.techStackSuggested : ['React / Next.js', 'Node.js', 'PostgreSQL'],
    difficulty: data.difficulty || 'Accessible',
    status: 'Recherche Développeurs',
    votes: 0,
    createdAt: new Date().toISOString(),
    authorEmail: tokenUser.email,
    authorName: tokenUser.name,
    devPledges: [],
    comments: [],
    developerBrief: data.developerBrief || {
      mvpScope: ['Interface mobile web responsive', 'Formulaire de signalement/interaction', 'Authentification locale'],
      localConstraints: ['Connexion intermittente possible', 'Multi-langue'],
      monetization: 'Modèle solidaire ou subvention',
      openSourceFriendly: true,
      architecturalTip: 'Concevoir avec une approche offline-first.',
    },
  };

  appsStore.unshift(newApp);
  savePersistedApps();
  persistAppToFirestore(newApp);
  res.json({ success: true, app: newApp });
});

function getCountryIsoCode(countryName: string): string {
  const map: Record<string, string> = {
    'Sénégal': 'SN',
    'Senegal': 'SN',
    'Côte d\'Ivoire': 'CI',
    'Cote d\'Ivoire': 'CI',
    'Mali': 'ML',
    'Guinée': 'GN',
    'Guinee': 'GN',
    'Cameroun': 'CM',
    'RDC': 'CD',
    'Congo': 'CG',
    'Kenya': 'KE',
    'Rwanda': 'RW',
    'Madagascar': 'MG',
    'Maroc': 'MA',
    'Tunisie': 'TN',
    'Algérie': 'DZ',
    'Algerie': 'DZ',
    'Nigeria': 'NG',
    'Nigéria': 'NG',
    'Ghana': 'GH',
    'Burkina Faso': 'BF',
    'Bénin': 'BJ',
    'Benin': 'BJ',
    'Togo': 'TG',
    'Niger': 'NE',
    'Gabon': 'GA',
    'Éthiopie': 'ET',
    'Ethiopie': 'ET',
    'Afrique du Sud': 'ZA',
    'Égypte': 'EG',
    'Egypte': 'EG',
    'Tanzanie': 'TZ',
    'Ouganda': 'UG',
    'Tchad': 'TD',
    'Mauritanie': 'MR',
  };
  return map[countryName] || 'AF';
}

function createFallbackProposals(params: {
  continent?: string;
  country?: string;
  sector?: string;
  focus?: string;
}): AppIdea[] {
  const cont: Continent = 'Afrique';
  const ctry = params.country || 'Sénégal';
  const cCode = getCountryIsoCode(ctry);
  const now = Date.now();
  const today = new Date().toISOString().split('T')[0];

  const pool = [
    {
      title: `${ctry} SoliGraines`,
      tagline: 'Bourse de troc de semences paysannes résistantes et alertes audio agronomiques',
      description: `Réseau communautaire permettant aux petits maraîchers de ${ctry} d'échanger des semences locales adaptées aux aléas climatiques et de recevoir des conseils audio en langues locales.`,
      sector: 'Agriculture & Alimentation' as Sector,
      problem: 'Dépendance excessive aux semences hybrides importées et pertes de récoltes accrues lors des sécheresses.',
      impact: 'Augmentation de 40% de la résilience alimentaire pour plus de 10 000 familles d\'agriculteurs.',
      stack: ['Flutter', 'SQLite Offline-first', 'Audio Web API', 'Bluetooth Mesh'],
      difficulty: 'Accessible',
      scope: ['Registre hors-ligne de variétés de semences', 'Messagerie vocale locale de troc', 'Synchronisation P2P sur les marchés'],
      constraints: ['Zone blanche / 2G intermittente', 'Batterie limitée', 'Interface entièrement audio/icônes'],
      monetization: 'Subventions de coopératives agricoles et micro-dons solidaires',
      tip: 'Compresser l\'audio en format Opus basse bande passante (6 kbps) pour fonctionner sur tout terminal.',
    },
    {
      title: `${ctry} Sang Direct`,
      tagline: 'Coordination citoyenne d\'urgence pour les donneurs de sang rares et sérums vitaux',
      description: `Dispositif d'alerte instantanée reliant banques de sang hospitalières, dispensaires de ${ctry} et donneurs volontaires compatibles sans connexion 4G requise.`,
      sector: 'Santé & Urgence' as Sector,
      problem: 'Mortalité critique en maternité et traumatologie due au manque de donneurs de sang rares disponibles à temps.',
      impact: 'Réduction de 70% du délai de recherche de poches sanguines lors des urgences vitales.',
      stack: ['Node.js', 'Passerelle USSD / SMS', 'PostgreSQL', 'PWA Offline'],
      difficulty: 'Modéré',
      scope: ['Base chiffrée et anonymisée des donneurs', 'Déclencheur d\'alerte SMS d\'urgence vitale', 'Console de suivi pour ambulanciers'],
      constraints: ['Fonctionnement 100% garanti par SMS simple', 'Confidentialité médicale absolue', 'Gratuité pour le patient'],
      monetization: 'Prise en charge par le ministère de la Santé et les organisations humanitaires',
      tip: 'Implémenter un routage SMS multi-opérateurs avec bascule automatique en cas de panne réseau.',
    },
    {
      title: `TontinePay ${ctry}`,
      tagline: 'Carnet de tontine numérique sécurisé par multi-signatures SMS et historique de crédit',
      description: `Plateforme décentralisée qui sécurise les cotisations des cercles d'épargne solidaire traditionnels à ${ctry} et certifie l'historique financier des commerçants non bancarisés.`,
      sector: 'Inclusion Financière & Tontines' as Sector,
      problem: 'Vols, litiges de trésorerie et exclusion du crédit bancaire des petits commerçants et associations de femmes.',
      impact: 'Sécurisation de plus de 200 000 € de micro-épargne communautaire par commune et accès facilité au micro-crédit.',
      stack: ['React Native', 'Crypto Ed25519', 'USSD Wrapper', 'Node.js'],
      difficulty: 'Modéré',
      scope: ['Tenue de registre des tours de rotation', 'Validation collective par SMS', 'Génération d\'attestation de bonne conduite financière'],
      constraints: ['Support des téléphones non-smartphones (USSD)', 'Pas d\'obligation de carte bancaire', 'Multi-signatures'],
      monetization: 'Frais forfaitaires symboliques de 0,5% par cycle de redistribution',
      tip: 'Assurer une signature cryptographique hors-ligne via scan de QR code entre membres lors des réunions physiques.',
    },
    {
      title: `AquaVeille ${ctry}`,
      tagline: 'Surveillance citoyenne et maintenance prédictive des points d\'eau potable',
      description: `Système de signalement ultra-rapide des pannes de forages et bornes-fontaines à ${ctry} avec géolocalisation des artisans réparateurs les plus proches.`,
      sector: 'Énergie, Eau & Climat' as Sector,
      problem: 'Points d\'eau ruraux restant en panne pendant des semaines obligeant les familles à consommer de l\'eau insalubre.',
      impact: 'Délai moyen de réparation divisé par 3 et accès garanti à l\'eau potable pour 45 000 habitants.',
      stack: ['LoRaWAN', 'ESP32', 'React Leaflet', 'Node.js API'],
      difficulty: 'Avancé',
      scope: ['Carte interactive en temps réel de l\'état des forages', 'Signalement de panne par USSD en 3 touches', 'Gestion des stocks de pièces détachées'],
      constraints: ['Climat aride et poussière', 'Alimentation 100% solaire des capteurs', 'Simplicité extrême pour l\'usager'],
      monetization: 'Contrat de maintenance financé par les collectivités locales et les régies des eaux',
      tip: 'Utiliser des micro-capteurs de pression d\'eau LoRa à longue portée (15 km) pour les zones rurales isolées.',
    },
  ];

  const icons = ['Baobab', 'ShieldCheck', 'Droplets', 'HeartHandshake'];

  return pool.map((item, idx) => ({
    id: `ai-gen-${now}-${idx}`,
    title: item.title,
    tagline: item.tagline,
    description: item.description,
    icon: icons[idx % icons.length],
    gradient: 'bg-black',
    continent: cont as Continent,
    country: ctry,
    countryCode: cCode,
    flag: cCode,
    sector: item.sector,
    targetAudience: `Citoyens, coopératives et soignants à ${ctry}`,
    problemSolved: item.problem,
    impactPotential: item.impact,
    techStackSuggested: item.stack,
    difficulty: item.difficulty as any,
    status: 'Idée IA du Jour',
    votes: 0,
    isDailyDrop: true,
    dailyDropDate: today,
    createdAt: new Date().toISOString(),
    devPledges: [],
    comments: [],
    developerBrief: {
      mvpScope: item.scope,
      localConstraints: item.constraints,
      monetization: item.monetization,
      openSourceFriendly: true,
      architecturalTip: item.tip,
    },
  }));
}

// 7. AI Generation: 4 New proposals exclusively for Africa (with resilient fallback)
app.post('/api/gemini/generate-proposals', requireAuth, async (req, res) => {
  const tokenUser = (req as any).user as StoredUser;
  if (!settingsStore.allowAIGeneration && !isAdminEmail(tokenUser.email)) {
    return res.status(403).json({
      success: false,
      error: "La génération de concepts par IA est temporairement désactivée par l'administration.",
    });
  }
  const { country = '', sector = 'Tous', focus = '' } = req.body;
  let newApps: AppIdea[] = [];

  if (ai) {
    try {
      const prompt = `Tu es un expert en innovation technologique en Afrique, design produit pour le bien commun africain et analyste des besoins locaux du continent africain non résolus par les géants de la Tech.
Génère EXACTEMENT 4 propositions d'applications mobiles ou web inédites et percutantes qui DEVRAIENT absolument exister EN AFRIQUE (et uniquement dans des pays africains) pour changer la vie des populations locales africaines.
Chaque application doit répondre à un vrai problème concret en Afrique (santé, agriculture, eau, transports ruraux, langues africaines, inclusion bancaire / Mobile Money / tontines, climat).
Critères de personnalisation:
- Continent exclusif : Afrique UNIQUEMENT (ne propose aucun pays hors d'Afrique)
- Pays africain ciblé (si précisé) : ${country || 'Choisis 4 pays africains variés (ex: Sénégal, Côte d\'Ivoire, Kenya, Maroc, RDC, Ghana, Rwanda, Cameroun, Mali, Madagascar)'}
- Secteur ciblé : ${sector === 'Tous' ? 'Secteurs variés à fort impact en Afrique' : sector}
- Thématique spécifique : ${focus || 'Besoins vitaux africains, écologie, solidarité, artisanat, Mobile Money ou logistique locale'}

Donne des noms mémorables et évocateurs, adaptés culturellement à l'Afrique (ex: SunuRécolte au Sénégal, SimbaGrid au Kenya, TontineTrust au Cameroun).
Réponds STRICTEMENT avec un tableau JSON de 4 objets au format suivant :
[
  {
    "title": "Nom percutant",
    "tagline": "Slogan accrocheur en une phrase",
    "description": "Description détaillée du concept adapté à l'Afrique",
    "continent": "Afrique",
    "country": "${country || 'Sénégal'}",
    "countryCode": "${country ? getCountryIsoCode(country) : 'SN'}",
    "sector": "${sector === 'Tous' ? 'Agriculture & Alimentation' : sector}",
    "targetAudience": "Public cible précis en Afrique",
    "problemSolved": "Le problème aigu et mal adressé qu'elle résout",
    "impactPotential": "Chiffre ou impact mesurable attendu",
    "techStackSuggested": ["Flutter", "Node.js", "Passerelle USSD / Mobile Money"],
    "difficulty": "Accessible",
    "mvpScope": ["Fonctionnalité 1", "Fonctionnalité 2", "Fonctionnalité 3"],
    "localConstraints": ["Contrainte 1 (offline-first / 2G)", "Contrainte 2"],
    "monetization": "Modèle économique pérenne ou solidaire",
    "architecturalTip": "Conseil d'architecture technique pour les devs africains"
  }
]`;

      let text = '';
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });
        text = response.text?.trim() || '';
      } catch (e1: any) {
        console.warn('gemini-3.1-flash-lite note, trying gemini-flash-latest:', e1?.message || e1);
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-flash-latest',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
            },
          });
          text = response.text?.trim() || '';
        } catch (e2: any) {
          console.warn('gemini-flash-latest note:', e2?.message || e2);
        }
      }

      if (text) {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const icons = ['Africa', 'Baobab', 'Adinkra', 'Djembe', 'AcaciaSun', 'ShieldCheck', 'HeartHandshake', 'Droplets', 'Wheat'];
          newApps = parsed.slice(0, 4).map((item: any, idx: number) => {
            const id = `ai-gen-${Date.now()}-${idx}`;
            const countryName = item.country || country || 'Sénégal';
            const cCode = (item.countryCode || getCountryIsoCode(countryName) || 'AF').toUpperCase();
            return {
              id,
              title: item.title,
              tagline: item.tagline,
              description: item.description,
              icon: icons[idx % icons.length],
              gradient: 'bg-black',
              continent: 'Afrique',
              country: countryName,
              countryCode: cCode,
              flag: cCode,
              sector: (item.sector as Sector) || 'Santé & Urgence',
              targetAudience: item.targetAudience,
              problemSolved: item.problemSolved,
              impactPotential: item.impactPotential,
              techStackSuggested: item.techStackSuggested || ['React', 'Node.js'],
              difficulty: (item.difficulty as any) || 'Modéré',
              status: 'Idée IA du Jour',
              votes: 0,
              isDailyDrop: true,
              dailyDropDate: new Date().toISOString().split('T')[0],
              createdAt: new Date().toISOString(),
              devPledges: [],
              comments: [],
              developerBrief: {
                mvpScope: item.mvpScope || ['Prototype v1', 'Interface mobile'],
                localConstraints: item.localConstraints || ['Hors-ligne', 'Bande passante limitée'],
                monetization: item.monetization || 'Modèle ouvert et subventions',
                openSourceFriendly: true,
                architecturalTip: item.architecturalTip || 'Prioriser la simplicité et les standards ouverts.',
              },
            };
          });
        }
      }
    } catch (geminiError: any) {
      console.warn('Gemini generate-proposals warning (activating intelligent contextual fallback):', geminiError?.message || geminiError);
    }
  }

  // If Gemini wasn't available, failed, or returned empty, generate using the dynamic fallback engine
  if (!newApps || newApps.length === 0) {
    newApps = createFallbackProposals({ continent: 'Afrique', country, sector, focus });
  }

  // Unmark old daily drops
  appsStore.forEach((a) => {
    if (a.isDailyDrop) a.isDailyDrop = false;
  });

  // Prepend newly generated apps to server-side appsStore
  appsStore.unshift(...newApps);
  savePersistedApps();
  persistMultipleAppsToFirestore(newApps);
  emitDailyDropPublished(newApps, 'ai');

  return res.json({
    success: true,
    count: newApps.length,
    apps: newApps,
    isAiGenerated: true,
  });
});

// 8. AI Assistant: Enhance a user's rough idea into a complete App Store spec
app.post('/api/gemini/enhance-idea', async (req, res) => {
  try {
    const { rawPitch, country, sector } = req.body;

    if (!ai) {
      return res.json({
        success: true,
        isFallback: true,
        enhanced: {
          title: 'App Concept',
          tagline: rawPitch.slice(0, 60),
          problemSolved: rawPitch,
          impactPotential: 'Potentiel fort pour les usagers locaux',
          techStackSuggested: ['React Native', 'Node.js', 'PostgreSQL'],
          mvpScope: ['Interface de base', 'Gestion utilisateurs', 'Notifications'],
          localConstraints: ['Faible débit', 'Paiement mobile'],
        },
      });
    }

    const prompt = `L'utilisateur a une idée d'application qui devrait exister en Afrique :
"${rawPitch}"
Pays africain ciblé : ${country || 'Afrique (pays à déterminer)'}
Secteur : ${sector || 'À déterminer'}

Structure cette idée en une fiche d'application professionnelle pour notre App Store africain des idées manquantes :
1. Un titre court, mémorable et adapté au contexte africain
2. Un slogan accrocheur (tagline)
3. La description élégante et claire
4. Le problème précis résolu
5. L'impact potentiel
6. La stack technique recommandée pour un développeur local en Afrique
7. Les 3 fonctionnalités du MVP
8. Les contraintes locales à prendre en compte (connexion 2G/3G, Mobile Money, USSD, langues locales)
9. Le modèle économique
10. Un conseil d'architecte logiciel

Réponds au format JSON strict.`;

    let text = '';
    const schemaConfig = {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          tagline: { type: Type.STRING },
          description: { type: Type.STRING },
          problemSolved: { type: Type.STRING },
          impactPotential: { type: Type.STRING },
          techStackSuggested: { type: Type.ARRAY, items: { type: Type.STRING } },
          mvpScope: { type: Type.ARRAY, items: { type: Type.STRING } },
          localConstraints: { type: Type.ARRAY, items: { type: Type.STRING } },
          monetization: { type: Type.STRING },
          architecturalTip: { type: Type.STRING },
        },
        required: [
          'title',
          'tagline',
          'description',
          'problemSolved',
          'impactPotential',
          'techStackSuggested',
          'mvpScope',
          'localConstraints',
          'monetization',
          'architecturalTip',
        ],
      },
    };

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: schemaConfig,
      });
      text = response.text?.trim() || '';
    } catch {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-flash-latest',
          contents: prompt,
          config: schemaConfig,
        });
        text = response.text?.trim() || '';
      } catch (e2) {
        console.warn('Enhance fallback triggered:', e2);
      }
    }

    const parsed = text
      ? JSON.parse(text)
      : {
          title: 'App Concept Afrique',
          tagline: rawPitch.slice(0, 60),
          description: rawPitch,
          problemSolved: rawPitch,
          impactPotential: 'Potentiel fort pour les communautés africaines locales',
          techStackSuggested: ['React Native', 'Node.js', 'Passerelle USSD / Mobile Money'],
          mvpScope: ['Interface mobile légère', 'Mode hors-ligne', 'Alertes SMS / Mobile Money'],
          localConstraints: ['Faible débit', 'Paiement Mobile Money'],
          monetization: 'Modèle solidaire et micro-commission',
          architecturalTip: 'Concevoir avec une approche offline-first.',
        };
    return res.json({ success: true, enhanced: parsed });
  } catch (error: any) {
    console.error('Error enhancing idea:', error);
    return res.status(500).json({ success: false, error: error?.message });
  }
});

// ================= COLLABORATIVE BUILDS, WEBVIEW, VERSIONS & AI/MCP BUILDER =================

function isPrivateIpAddress(ip: string): boolean {
  if (ip === '::1' || ip === '0:0:0:0:0:0:0:1' || ip.startsWith('fe80:') || ip.startsWith('fc') || ip.startsWith('fd')) {
    return true;
  }
  const cleanIp = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
  const parts = cleanIp.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return false;
  const [a, b] = parts;
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

async function assertSafeOutboundHttpsUrl(rawUrl: string): Promise<URL> {
  const parsed = new URL(rawUrl.trim());
  if (parsed.protocol !== 'https:') {
    throw new Error('Seules les URLs HTTPS publiques sont autorisées pour les connecteurs externes.');
  }
  const host = parsed.hostname.toLowerCase();
  if (
    host === 'localhost' ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.endsWith('.localhost')
  ) {
    throw new Error('Adresse locale ou interne non autorisée.');
  }
  if (net.isIP(host) && isPrivateIpAddress(host)) {
    throw new Error('Adresse IP privée non autorisée.');
  }
  try {
    const resolved = await dns.lookup(host, { all: true });
    for (const addr of resolved) {
      if (isPrivateIpAddress(addr.address)) {
        throw new Error('Résolution DNS vers une adresse privée bloquée.');
      }
    }
  } catch (err: any) {
    if (err?.message?.includes('bloquée')) throw err;
  }
  return parsed;
}

function sanitizeClientHttpUrl(rawUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  try {
    const u = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    if (u.protocol === 'https:' || u.protocol === 'http:') {
      return u.toString();
    }
  } catch {
    return '';
  }
  return '';
}

function sanitizeScreenshots(rawList: unknown): string[] {
  if (!Array.isArray(rawList)) return [];
  const out: string[] = [];
  for (const item of rawList.slice(0, 6)) {
    if (typeof item !== 'string') continue;
    const s = item.trim();
    if (
      (s.startsWith('data:image/jpeg;base64,') ||
        s.startsWith('data:image/png;base64,') ||
        s.startsWith('data:image/webp;base64,')) &&
      s.length <= 450_000
    ) {
      out.push(s);
    } else if (s.startsWith('https://') && s.length <= 600) {
      out.push(s);
    }
  }
  return out;
}

function isBuildMember(build: ProjectBuild, user: StoredUser): boolean {
  if (build.ownerId === user.id) return true;
  if (isAdminEmail(user.email)) return true;
  return (build.members || []).some((m) => m.userId === user.id);
}

// List builds (public, optionally filtered by appId)
app.get('/api/builds', (req, res) => {
  const { appId } = req.query;
  let list = buildsStore.filter((b) => b.isPublic);
  if (appId && typeof appId === 'string') {
    list = list.filter((b) => b.appId === appId);
  }
  list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return res.json({ success: true, builds: list });
});

// Get single build (public render access for all visitors)
app.get('/api/builds/:buildId', (req, res) => {
  const { buildId } = req.params;
  const found = buildsStore.find((b) => b.id === buildId);
  if (!found || !found.isPublic) {
    return res.status(404).json({ success: false, error: 'Rendu ou projet introuvable.' });
  }
  return res.json({ success: true, build: found });
});

// Create a new Solo or Squad build for an AppIdea
app.post('/api/builds', requireAuth, (req, res) => {
  const user = (req as any).user as StoredUser;
  const {
    appId,
    title,
    summary = '',
    progressStage = 'Prototype',
    progressPercent = 35,
    isGroupProject = true,
    githubUrl = '',
    versionTag = 'v0.1.0',
    changelog = 'Version initiale publiée',
    mode = 'external_url',
    previewUrl = '',
    htmlCode = '',
    screenshots = [],
    memberRole = 'Lead Développeur',
    aiEngineLabel = 'Équipe Humaine',
    mcpToolsUsed = [],
  } = req.body;

  const targetApp = appsStore.find((a) => a.id === appId);
  if (!targetApp) {
    return res.status(404).json({ success: false, error: 'Application parente introuvable.' });
  }

  if (!title || String(title).trim().length < 2) {
    return res.status(400).json({ success: false, error: 'Titre du projet ou de l\'équipe requis.' });
  }

  const safePreviewUrl = sanitizeClientHttpUrl(previewUrl);
  const safeGithubUrl = sanitizeClientHttpUrl(githubUrl);
  const safeHtml = typeof htmlCode === 'string' ? htmlCode.slice(0, 250_000) : '';

  if (mode === 'external_url' && !safePreviewUrl && !safeGithubUrl) {
    return res.status(400).json({
      success: false,
      error: 'Fournissez une URL de rendu WebView valide ou un lien GitHub.',
    });
  }

  const nowIso = new Date().toISOString();
  const buildId = `bld-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const versionId = `ver-${Date.now()}`;

  const initialMember: BuildMember = {
    userId: user.id,
    name: user.name,
    role: String(memberRole || user.role || 'Lead Développeur').slice(0, 60),
    country: user.country || targetApp.country,
    joinedAt: nowIso,
  };

  const initialVersion: BuildVersion = {
    id: versionId,
    versionTag: String(versionTag || 'v0.1.0').slice(0, 32),
    changelog: String(changelog || 'Publication initiale').slice(0, 1000),
    createdAt: nowIso,
    authorName: user.name,
    mode: mode === 'internal_ai' || mode === 'html_bundle' ? mode : 'external_url',
    previewUrl: safePreviewUrl || undefined,
    htmlCode: safeHtml || undefined,
    githubUrl: safeGithubUrl || undefined,
    screenshots: sanitizeScreenshots(screenshots),
    aiEngineLabel: String(aiEngineLabel || 'Équipe Humaine').slice(0, 80),
    mcpToolsUsed: Array.isArray(mcpToolsUsed) ? mcpToolsUsed.slice(0, 12).map(String) : [],
  };

  const allowedStages = ['Concept', 'Prototype', 'Alpha', 'Beta', 'Production'];
  const cleanStage = allowedStages.includes(progressStage) ? progressStage : 'Prototype';
  const cleanPercent = Math.min(100, Math.max(0, Number(progressPercent) || 35));

  const newBuild: ProjectBuild = {
    id: buildId,
    appId: targetApp.id,
    appTitle: targetApp.title,
    title: String(title).trim().slice(0, 140),
    summary: String(summary || '').trim().slice(0, 1800),
    progressStage: cleanStage as any,
    progressPercent: cleanPercent,
    isGroupProject: Boolean(isGroupProject),
    isPublic: true,
    ownerId: user.id,
    ownerName: user.name,
    members: [initialMember],
    githubUrl: safeGithubUrl || undefined,
    activeVersionId: versionId,
    versions: [initialVersion],
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  buildsStore.unshift(newBuild);
  savePersistedBuilds();
  persistBuildToFirestore(newBuild);

  // Move parent app status forward if still waiting for developers
  if (targetApp.status === 'Recherche Développeurs' || targetApp.status === 'Idée IA du Jour') {
    targetApp.status = 'Prototypage en cours';
    savePersistedApps();
    persistAppToFirestore(targetApp);
  }

  return res.json({ success: true, build: newBuild });
});

// Join an existing group/squad build
app.post('/api/builds/:buildId/join', requireAuth, (req, res) => {
  const user = (req as any).user as StoredUser;
  const { buildId } = req.params;
  const { role = 'Développeur Full-Stack' } = req.body;

  const idx = buildsStore.findIndex((b) => b.id === buildId);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Projet introuvable.' });
  }

  const build = buildsStore[idx];
  if (!build.isGroupProject) {
    return res.status(400).json({ success: false, error: 'Ce projet est configuré en mode solo.' });
  }

  if (build.members.some((m) => m.userId === user.id)) {
    return res.json({ success: true, build, alreadyMember: true });
  }

  if (build.members.length >= 20) {
    return res.status(400).json({ success: false, error: 'Ce groupe a atteint sa capacité maximale (20 membres).' });
  }

  build.members.push({
    userId: user.id,
    name: user.name,
    role: String(role || user.role || 'Contributeur').slice(0, 60),
    country: user.country || 'Afrique',
    joinedAt: new Date().toISOString(),
  });
  build.updatedAt = new Date().toISOString();

  savePersistedBuilds();
  persistBuildToFirestore(build);

  return res.json({ success: true, build });
});

// Publish a new version to an existing build
app.post('/api/builds/:buildId/versions', requireAuth, (req, res) => {
  const user = (req as any).user as StoredUser;
  const { buildId } = req.params;
  const {
    versionTag,
    changelog = '',
    mode = 'external_url',
    previewUrl = '',
    htmlCode = '',
    githubUrl = '',
    screenshots = [],
    progressStage,
    progressPercent,
    summary,
    aiEngineLabel = 'Équipe Humaine',
    mcpToolsUsed = [],
  } = req.body;

  const idx = buildsStore.findIndex((b) => b.id === buildId);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Build introuvable.' });
  }

  const build = buildsStore[idx];
  if (!isBuildMember(build, user)) {
    return res.status(403).json({
      success: false,
      error: 'Rejoignez d\'abord ce groupe ou créez votre propre build pour publier une version.',
    });
  }

  const nowIso = new Date().toISOString();
  const nextVerNumber = `v0.${build.versions.length + 1}.0`;
  const versionId = `ver-${Date.now()}`;
  const safePreviewUrl = sanitizeClientHttpUrl(previewUrl);
  const safeGithubUrl = sanitizeClientHttpUrl(githubUrl);
  const safeHtml = typeof htmlCode === 'string' ? htmlCode.slice(0, 250_000) : '';

  const newVersion: BuildVersion = {
    id: versionId,
    versionTag: String(versionTag || nextVerNumber).trim().slice(0, 32),
    changelog: String(changelog || 'Mise à jour du prototype').trim().slice(0, 1000),
    createdAt: nowIso,
    authorName: user.name,
    mode: mode === 'internal_ai' || mode === 'html_bundle' ? mode : 'external_url',
    previewUrl: safePreviewUrl || undefined,
    htmlCode: safeHtml || undefined,
    githubUrl: safeGithubUrl || build.githubUrl || undefined,
    screenshots: sanitizeScreenshots(screenshots),
    aiEngineLabel: String(aiEngineLabel || 'Équipe Humaine').slice(0, 80),
    mcpToolsUsed: Array.isArray(mcpToolsUsed) ? mcpToolsUsed.slice(0, 12).map(String) : [],
  };

  build.versions.unshift(newVersion);
  if (build.versions.length > 25) {
    build.versions = build.versions.slice(0, 25);
  }
  build.activeVersionId = versionId;
  if (safeGithubUrl) build.githubUrl = safeGithubUrl;
  if (summary && String(summary).trim()) {
    build.summary = String(summary).trim().slice(0, 1800);
  }
  const allowedStages = ['Concept', 'Prototype', 'Alpha', 'Beta', 'Production'];
  if (progressStage && allowedStages.includes(progressStage)) {
    build.progressStage = progressStage;
  }
  if (typeof progressPercent === 'number' || (typeof progressPercent === 'string' && progressPercent !== '')) {
    build.progressPercent = Math.min(100, Math.max(0, Number(progressPercent)));
  }
  build.updatedAt = nowIso;

  savePersistedBuilds();
  persistBuildToFirestore(build);

  return res.json({ success: true, build, version: newVersion });
});

// Switch active published version
app.patch('/api/builds/:buildId/active-version', requireAuth, (req, res) => {
  const user = (req as any).user as StoredUser;
  const { buildId } = req.params;
  const { versionId } = req.body;

  const idx = buildsStore.findIndex((b) => b.id === buildId);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Build introuvable.' });
  }

  const build = buildsStore[idx];
  if (!isBuildMember(build, user)) {
    return res.status(403).json({ success: false, error: 'Action réservée aux membres du projet.' });
  }

  if (!build.versions.some((v) => v.id === versionId)) {
    return res.status(404).json({ success: false, error: 'Version introuvable.' });
  }

  build.activeVersionId = versionId;
  build.updatedAt = new Date().toISOString();
  savePersistedBuilds();
  persistBuildToFirestore(build);

  return res.json({ success: true, build });
});

// ================= REAL MCP (MODEL CONTEXT PROTOCOL) HTTP/JSON-RPC CLIENT =================

async function sendMcpJsonRpc(
  url: string,
  method: string,
  params: Record<string, unknown> = {},
  bearerToken?: string,
  sessionId?: string
): Promise<{ result: any; sessionId?: string }> {
  const parsedUrl = await assertSafeOutboundHttpsUrl(url);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    };
    if (bearerToken && bearerToken.trim()) {
      headers.Authorization = `Bearer ${bearerToken.trim()}`;
    }
    if (sessionId) {
      headers['Mcp-Session-Id'] = sessionId;
    }

    const resp = await fetch(parsedUrl.toString(), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: `mcp-${Date.now()}`,
        method,
        params,
      }),
      signal: controller.signal,
    });

    const nextSessionId = resp.headers.get('mcp-session-id') || sessionId;
    const contentType = resp.headers.get('content-type') || '';
    const rawText = await resp.text();

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}: ${rawText.slice(0, 220)}`);
    }

    let payload: any = null;
    if (contentType.includes('text/event-stream')) {
      const dataLines = rawText
        .split('\n')
        .filter((l) => l.startsWith('data:'))
        .map((l) => l.slice(5).trim())
        .filter(Boolean);
      for (let i = dataLines.length - 1; i >= 0; i--) {
        try {
          const parsed = JSON.parse(dataLines[i]);
          if (parsed && (parsed.result !== undefined || parsed.error !== undefined)) {
            payload = parsed;
            break;
          }
        } catch {
          // continue
        }
      }
    } else if (rawText.trim()) {
      payload = JSON.parse(rawText);
    }

    if (payload?.error) {
      throw new Error(payload.error.message || JSON.stringify(payload.error));
    }

    return { result: payload?.result ?? payload, sessionId: nextSessionId };
  } finally {
    clearTimeout(timeout);
  }
}

app.post('/api/mcp/inspect', requireAuth, async (req, res) => {
  const { url, bearerToken } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ success: false, error: 'URL du serveur MCP requise.' });
  }

  try {
    const initResp = await sendMcpJsonRpc(
      url,
      'initialize',
      {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {}, resources: {} },
        clientInfo: { name: 'tomorrow-studio', version: '1.0.0' },
      },
      bearerToken
    );

    const sessionId = initResp.sessionId;
    let tools: any[] = [];
    let resources: any[] = [];

    try {
      const toolsResp = await sendMcpJsonRpc(url, 'tools/list', {}, bearerToken, sessionId);
      if (Array.isArray(toolsResp.result?.tools)) {
        tools = toolsResp.result.tools;
      }
    } catch {
      // Server may not expose tools
    }

    try {
      const resResp = await sendMcpJsonRpc(url, 'resources/list', {}, bearerToken, sessionId);
      if (Array.isArray(resResp.result?.resources)) {
        resources = resResp.result.resources;
      }
    } catch {
      // Server may not expose resources
    }

    return res.json({
      success: true,
      serverInfo: initResp.result?.serverInfo || null,
      tools,
      resources,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: `Connexion MCP impossible : ${err?.message || 'Erreur réseau'}`,
    });
  }
});

app.post('/api/mcp/call-tool', requireAuth, async (req, res) => {
  const { url, bearerToken, toolName, arguments: toolArgs = {} } = req.body;
  if (!url || !toolName) {
    return res.status(400).json({ success: false, error: 'URL MCP et nom de l\'outil requis.' });
  }

  try {
    const initResp = await sendMcpJsonRpc(
      url,
      'initialize',
      {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'tomorrow-studio', version: '1.0.0' },
      },
      bearerToken
    );
    const callResp = await sendMcpJsonRpc(
      url,
      'tools/call',
      { name: toolName, arguments: toolArgs },
      bearerToken,
      initResp.sessionId
    );
    return res.json({ success: true, result: callResp.result });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: `Appel outil MCP échoué : ${err?.message || 'Erreur'}`,
    });
  }
});

// ================= EXTERNAL AGENT + INTERNAL GEMINI AI BUILDER =================

async function callExternalAgentProvider(
  agent: {
    name: string;
    provider: string;
    role: string;
    model: string;
    endpointUrl?: string;
    token: string;
  },
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  if (!agent.token || !agent.token.trim()) {
    throw new Error(`Token manquant pour l'agent ${agent.name}`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 35000);

  try {
    if (agent.provider === 'anthropic') {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': agent.token.trim(),
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: agent.model || 'claude-3-5-sonnet-latest',
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
        signal: controller.signal,
      });
      const data = (await resp.json()) as any;
      if (!resp.ok) {
        throw new Error(data?.error?.message || `Anthropic HTTP ${resp.status}`);
      }
      return data?.content?.[0]?.text || '';
    }

    let endpoint = 'https://api.openai.com/v1/chat/completions';
    if (agent.provider === 'mistral') {
      endpoint = 'https://api.mistral.ai/v1/chat/completions';
    } else if (agent.provider === 'groq') {
      endpoint = 'https://api.groq.com/openai/v1/chat/completions';
    } else if (agent.provider === 'openrouter') {
      endpoint = 'https://openrouter.ai/api/v1/chat/completions';
    } else if (agent.provider === 'custom_openai' && agent.endpointUrl) {
      const safe = await assertSafeOutboundHttpsUrl(agent.endpointUrl);
      endpoint = safe.toString();
    }

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${agent.token.trim()}`,
      },
      body: JSON.stringify({
        model: agent.model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
      signal: controller.signal,
    });
    const data = (await resp.json()) as any;
    if (!resp.ok) {
      throw new Error(data?.error?.message || `Agent HTTP ${resp.status}`);
    }
    return data?.choices?.[0]?.message?.content || '';
  } finally {
    clearTimeout(timeout);
  }
}

function extractHtmlDocument(raw: string): string {
  const fenced = raw.match(/```html\s*([\s\S]*?)```/i) || raw.match(/```\s*(<!doctype[\s\S]*?)```/i);
  if (fenced && fenced[1]) return fenced[1].trim();
  const docStart = raw.search(/<!doctype html|<html/i);
  if (docStart !== -1) {
    const docEnd = raw.lastIndexOf('</html>');
    if (docEnd !== -1) return raw.slice(docStart, docEnd + 7).trim();
    return raw.slice(docStart).trim();
  }
  return raw.trim();
}

app.post('/api/builder/ai-generate', requireAuth, async (req, res) => {
  const {
    appId,
    instructions = '',
    currentHtml = '',
    externalAgents = [],
    mcpServers = [],
    useInternalAi = true,
  } = req.body;

  const targetApp = appsStore.find((a) => a.id === appId);
  if (!targetApp) {
    return res.status(404).json({ success: false, error: 'Projet introuvable.' });
  }

  const executionLogs: { step: string; actor: string; status: 'ok' | 'warn' | 'error'; detail: string; timestamp: string }[] = [];
  const mcpToolsUsed: string[] = [];
  const agentsUsed: string[] = [];
  let mcpContextBlock = '';

  // 1. Gather context from connected MCP servers if requested
  if (Array.isArray(mcpServers) && mcpServers.length > 0) {
    for (const mcp of mcpServers.slice(0, 4)) {
      if (!mcp?.url) continue;
      try {
        const initResp = await sendMcpJsonRpc(
          mcp.url,
          'initialize',
          {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {}, resources: {} },
            clientInfo: { name: 'tomorrow-builder', version: '1.0.0' },
          },
          mcp.bearerToken
        );
        const toolsResp = await sendMcpJsonRpc(mcp.url, 'tools/list', {}, mcp.bearerToken, initResp.sessionId);
        const availableTools = Array.isArray(toolsResp.result?.tools) ? toolsResp.result.tools : [];
        const selectedNames: string[] = Array.isArray(mcp.selectedToolNames) ? mcp.selectedToolNames : [];

        mcpContextBlock += `\n[MCP Server: ${mcp.name || mcp.url}]\nOutils disponibles: ${availableTools
          .slice(0, 10)
          .map((t: any) => `${t.name} (${t.description || ''})`)
          .join('; ')}\n`;

        // Execute zero-arg / query-compatible selected tools if any
        for (const toolName of selectedNames.slice(0, 2)) {
          try {
            const callResp = await sendMcpJsonRpc(
              mcp.url,
              'tools/call',
              { name: toolName, arguments: { query: targetApp.title } },
              mcp.bearerToken,
              initResp.sessionId
            );
            mcpToolsUsed.push(`${mcp.name || 'MCP'}:${toolName}`);
            mcpContextBlock += `Résultat outil ${toolName}: ${JSON.stringify(callResp.result).slice(0, 1200)}\n`;
          } catch (toolErr: any) {
            executionLogs.push({
              step: 'MCP Tool Call',
              actor: mcp.name || 'MCP',
              status: 'warn',
              detail: `${toolName}: ${toolErr?.message || 'ignoré'}`,
              timestamp: new Date().toISOString(),
            });
          }
        }

        executionLogs.push({
          step: 'MCP Context',
          actor: mcp.name || 'Serveur MCP',
          status: 'ok',
          detail: `${availableTools.length} outil(s) synchronisé(s)`,
          timestamp: new Date().toISOString(),
        });
      } catch (mcpErr: any) {
        executionLogs.push({
          step: 'MCP Connect',
          actor: mcp.name || 'Serveur MCP',
          status: 'warn',
          detail: mcpErr?.message || 'Serveur inaccessible',
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  // 2. Build the master prompt for the African project
  const projectSpec = `
Projet : ${targetApp.title}
Pays : ${targetApp.country} (${targetApp.continent})
Secteur : ${targetApp.sector}
Accroche : ${targetApp.tagline}
Description : ${targetApp.description}
Problème terrain résolu : ${targetApp.problemSolved}
Impact visé : ${targetApp.impactPotential}
Public cible : ${targetApp.targetAudience}
Périmètre MVP : ${(targetApp.developerBrief?.mvpScope || []).join(' | ')}
Contraintes locales : ${(targetApp.developerBrief?.localConstraints || []).join(' | ')}
Conseil d'architecture : ${targetApp.developerBrief?.architecturalTip || ''}
Instructions supplémentaires de l'utilisateur : ${instructions || 'Créer un prototype complet, interactif et immédiatement utilisable.'}
${mcpContextBlock ? `\nContexte MCP connecté :\n${mcpContextBlock}` : ''}
`.trim();

  // 3. Run external user-supplied agents pipeline (in-memory tokens only, never persisted)
  const enabledAgents = Array.isArray(externalAgents)
    ? externalAgents.filter((a: any) => a && a.enabled && a.token)
    : [];
  let agentBriefs = '';
  let candidateHtmlFromExternal = '';

  for (const agent of enabledAgents.slice(0, 4)) {
    try {
      const rolePrompt =
        agent.role === 'Développeur Full-Stack'
          ? `Tu es un ${agent.role}. Génère un document HTML5 COMPLET, autonome et interactif (<!DOCTYPE html>...</html>) utilisant Tailwind CSS CDN (<script src="https://cdn.tailwindcss.com"></script>) et JavaScript vanilla pour ce projet africain. Pas de placeholder mort : tout doit être interactif (simulation de données locales, formulaires fonctionnels, adaptation Mobile Money / Offline-first si pertinent).`
          : `Tu es ${agent.role} sur le projet "${targetApp.title}". Fournis des spécifications concrètes, concises et directement exploitables pour le prototype web.`;

      const output = await callExternalAgentProvider(
        agent,
        rolePrompt,
        `${projectSpec}\n${agentBriefs ? `\nTravaux des agents précédents :\n${agentBriefs}` : ''}${
          currentHtml ? `\nCode HTML existant à améliorer :\n${String(currentHtml).slice(0, 8000)}` : ''
        }`
      );

      agentsUsed.push(`${agent.name} (${agent.role})`);
      if (agent.role === 'Développeur Full-Stack' && /<!doctype html|<html/i.test(output)) {
        candidateHtmlFromExternal = extractHtmlDocument(output);
      } else {
        agentBriefs += `\n[${agent.name} - ${agent.role}]:\n${output.slice(0, 2500)}\n`;
      }

      executionLogs.push({
        step: `Agent ${agent.role}`,
        actor: agent.name,
        status: 'ok',
        detail: `Contribution générée (${output.length} caractères)`,
        timestamp: new Date().toISOString(),
      });
    } catch (agentErr: any) {
      executionLogs.push({
        step: `Agent ${agent.role}`,
        actor: agent.name,
        status: 'error',
        detail: agentErr?.message || 'Erreur d\'appel API',
        timestamp: new Date().toISOString(),
      });
    }
  }

  // 4. Internal Gemini synthesis (if enabled or if no external HTML produced)
  let finalHtml = candidateHtmlFromExternal;
  let summary = `Prototype interactif généré pour ${targetApp.title} (${targetApp.country}).`;

  if (useInternalAi || !finalHtml) {
    if (!ai) {
      if (!finalHtml) {
        return res.status(503).json({
          success: false,
          error:
            'Clé GEMINI_API_KEY non configurée sur le serveur et aucun agent externe n\'a généré de rendu HTML.',
          executionLogs,
        });
      }
    } else {
      try {
        const builderPrompt = `Tu es un architecte produit et développeur Full-Stack senior spécialisé dans les applications à impact en Afrique.
Construis une application web COMPLÈTE, AUTONOME, MODERNE et 100% INTERACTIVE en un seul fichier HTML5 (<!DOCTYPE html> ... </html>) pour le projet suivant :

${projectSpec}
${agentBriefs ? `\nRecommandations des agents connectés :\n${agentBriefs}` : ''}
${
  currentHtml
    ? `\nVoici la version précédente à faire évoluer selon les nouvelles instructions :\n${String(currentHtml).slice(0, 12000)}`
    : ''
}
${
  candidateHtmlFromExternal
    ? `\nBase HTML générée par l'agent externe à perfectionner et unifier :\n${candidateHtmlFromExternal.slice(0, 12000)}`
    : ''
}

Exigences techniques impératives :
1. Utilise <script src="https://cdn.tailwindcss.com"></script> et une typographie soignée (Plus Jakarta Sans via Google Fonts).
2. Design épuré, haut niveau, responsive (mobile + desktop), contrasté, sans texte factice "Lorem ipsum".
3. Fonctionnalités RÉELLEMENT interactives en JavaScript dans la page : navigation par onglets/vues, formulaire de création/action qui met à jour la liste en direct avec stockage localStorage ou mémoire, indicateurs de données réalistes adaptés à ${targetApp.country} (devises locales FCFA/KES/MAD/NGN selon le pays, contraintes réseau 2G/hors-ligne simulées avec bouton de bascule Hors-ligne / Synchro).
4. Zéro appel fetch vers des domaines externes susceptibles d'échouer. Tout doit fonctionner en autonomie dans une WebView sandboxée.
5. Réponds STRICTEMENT avec un objet JSON contenant deux champs :
   - "summary": résumé en 2 phrases des fonctionnalités réalisées
   - "htmlCode": le code HTML5 complet commençant par <!DOCTYPE html>`;

        let rawResponse = '';
        try {
          const resp = await ai.models.generateContent({
            model: 'gemini-4-hydrogen',
            contents: builderPrompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  summary: { type: Type.STRING },
                  htmlCode: { type: Type.STRING },
                },
                required: ['summary', 'htmlCode'],
              },
            },
          });
          rawResponse = resp.text?.trim() || '';
          agentsUsed.unshift('tomorrow IA (Gemini)');
        } catch (err1: any) {
          console.warn('gemini-4-hydrogen fallback to gemini-3.1-flash-lite:', err1?.message || err1);
          const resp = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: builderPrompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  summary: { type: Type.STRING },
                  htmlCode: { type: Type.STRING },
                },
                required: ['summary', 'htmlCode'],
              },
            },
          });
          rawResponse = resp.text?.trim() || '';
          agentsUsed.unshift('tomorrow IA (Gemini Lite)');
        }

        if (rawResponse) {
          const parsed = JSON.parse(rawResponse);
          if (parsed?.htmlCode) {
            finalHtml = extractHtmlDocument(parsed.htmlCode);
          }
          if (parsed?.summary) {
            summary = parsed.summary;
          }
          executionLogs.push({
            step: 'Synthèse & Build UI',
            actor: 'tomorrow IA',
            status: 'ok',
            detail: 'Application interactive générée avec succès',
            timestamp: new Date().toISOString(),
          });
        }
      } catch (aiErr: any) {
        executionLogs.push({
          step: 'Synthèse IA interne',
          actor: 'tomorrow IA',
          status: 'error',
          detail: aiErr?.message || 'Erreur API Gemini',
          timestamp: new Date().toISOString(),
        });
        if (!finalHtml) {
          return res.status(502).json({
            success: false,
            error: `La génération IA a échoué : ${aiErr?.message || 'Erreur inconnue'}`,
            executionLogs,
          });
        }
      }
    }
  }

  if (!finalHtml) {
    return res.status(500).json({
      success: false,
      error: 'Aucun rendu HTML n\'a pu être produit. Vérifiez vos agents ou réessayez.',
      executionLogs,
    });
  }

  return res.json({
    success: true,
    htmlCode: finalHtml,
    summary,
    agentsUsed,
    mcpToolsUsed,
    executionLogs,
  });
});

// ================= GOOGLE-POWERED AFRICAN LANGUAGE TRANSLATION =================
const serverTranslationCache = new Map<string, string>();

app.post('/api/gemini/translate', async (req, res) => {
  const { targetLang, targetLangName, texts } = req.body || {};

  if (!targetLang || typeof targetLang !== 'string' || !Array.isArray(texts)) {
    return res.status(400).json({ success: false, error: 'Paramètres de traduction invalides.' });
  }

  const cleanLang = targetLang.trim().toLowerCase();
  if (cleanLang === 'fr') {
    return res.json({ success: true, translations: texts });
  }

  const uniqueInputs: string[] = Array.from(
    new Set(
      texts
        .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
        .map((t) => t.trim())
    )
  ).slice(0, 120);

  if (uniqueInputs.length === 0) {
    return res.json({ success: true, translations: {} });
  }

  const resultMap: Record<string, string> = {};
  const missingInputs: string[] = [];

  for (const item of uniqueInputs) {
    const cacheKey = `${cleanLang}::${item}`;
    const cached = serverTranslationCache.get(cacheKey);
    if (cached) {
      resultMap[item] = cached;
    } else {
      missingInputs.push(item);
    }
  }

  if (missingInputs.length === 0) {
    return res.json({ success: true, translations: resultMap });
  }

  if (!ai) {
    return res.status(503).json({
      success: false,
      error: 'Clé GEMINI_API_KEY non configurée sur le serveur pour la traduction Google.',
    });
  }

  try {
    const prompt = `Tu es le moteur de traduction multilingue officiel propulsé par Google pour la plateforme africaine "tomorrow".
Traduis fidèlement et naturellement la liste JSON suivante de textes (du français ou de l'anglais) vers la langue cible : ${targetLangName || cleanLang} (code: ${cleanLang}).

Règles strictes :
1. Retourne EXACTEMENT le même nombre d'éléments (${missingInputs.length}) dans le même ordre.
2. Conserve intacts les noms propres de marque ("tomorrow", "Jdeek studio"), les sigles techniques ("PWA", "MCP", "GitHub", "API", "WebView", "USSD", "SMS", "FCFA", "IA"), et les symboles/emojis.
3. Adapte les expressions UI (boutons, menus, descriptions d'applications africaines) de façon idiomatique et naturelle dans la langue ${targetLangName || cleanLang}.
4. Ne commente rien, retourne strictement le tableau JSON de chaînes traduites.

Textes à traduire (${missingInputs.length}) :
${JSON.stringify(missingInputs)}`;

    let rawJson = '';
    try {
      const resp = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
      });
      rawJson = resp.text?.trim() || '[]';
    } catch (primaryErr: any) {
      console.warn('Translation primary model fallback:', primaryErr?.message || primaryErr);
      const resp = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
      });
      rawJson = resp.text?.trim() || '[]';
    }

    const translatedArray: unknown = JSON.parse(rawJson);
    if (Array.isArray(translatedArray)) {
      missingInputs.forEach((orig, idx) => {
        const val = translatedArray[idx];
        if (typeof val === 'string' && val.trim().length > 0) {
          const cleaned = val.trim();
          resultMap[orig] = cleaned;
          serverTranslationCache.set(`${cleanLang}::${orig}`, cleaned);
        } else {
          resultMap[orig] = orig;
        }
      });
    }

    return res.json({ success: true, translations: resultMap });
  } catch (err: any) {
    console.error('Google Gemini translation error:', err?.message || err);
    return res.status(502).json({
      success: false,
      error: 'Erreur lors de la traduction Google.',
    });
  }
});

// ================= PORTFOLIOS, PROFILES, INVITATIONS & SHORT CHAT =================

// List public portfolios/profiles (no PII exposed)
app.get('/api/profiles', (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
  const availability = typeof req.query.availability === 'string' ? req.query.availability : '';

  let list = Array.from(profilesStore.values());
  if (q) {
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.country.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q) ||
        p.headline.toLowerCase().includes(q) ||
        p.bio.toLowerCase().includes(q) ||
        p.skills.some((s) => s.toLowerCase().includes(q))
    );
  }
  if (availability && availability !== 'Tous') {
    list = list.filter((p) => p.availability === availability);
  }

  list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return res.json({ success: true, profiles: list });
});

// Get single public profile + contributions summary
app.get('/api/profiles/:userId', (req, res) => {
  const { userId } = req.params;
  const profile = profilesStore.get(userId);
  if (!profile) {
    return res.status(404).json({ success: false, error: 'Profil introuvable.' });
  }

  const buildsCount = buildsStore.filter((b) =>
    b.members.some((m) => m.userId === userId)
  ).length;
  const pledgesCount = appsStore.filter((a) =>
    (a.devPledges || []).some(
      (p) => p.name.toLowerCase() === profile.name.toLowerCase()
    )
  ).length;

  return res.json({
    success: true,
    profile,
    stats: { buildsCount, pledgesCount },
  });
});

// Update authenticated user's brief portfolio
app.put('/api/profiles/me', requireAuth, (req, res) => {
  const user: StoredUser = (req as any).user;
  const body = req.body || {};
  const existing = ensurePublicProfileForUser(user);

  const allowedAvailability: AvailabilityStatus[] = [
    'Disponible',
    'Ouvert aux collabs',
    'Occupé',
  ];
  const nextAvailability: AvailabilityStatus = allowedAvailability.includes(body.availability)
    ? body.availability
    : existing.availability;

  const cleanHeadline =
    typeof body.headline === 'string'
      ? body.headline.trim().slice(0, 100)
      : existing.headline;
  const cleanBio =
    typeof body.bio === 'string' ? body.bio.trim().slice(0, 400) : existing.bio;

  const cleanSkills: string[] = Array.isArray(body.skills)
    ? body.skills
        .filter((s: unknown): s is string => typeof s === 'string' && s.trim().length > 0)
        .map((s: string) => s.trim().slice(0, 32))
        .slice(0, 8)
    : existing.skills;

  const cleanItems: PortfolioItem[] = Array.isArray(body.portfolioItems)
    ? body.portfolioItems
        .filter((item: any) => item && typeof item.title === 'string' && item.title.trim())
        .slice(0, 4)
        .map((item: any, idx: number) => ({
          id:
            typeof item.id === 'string' && item.id.trim()
              ? item.id.trim().slice(0, 64)
              : `pf-${Date.now()}-${idx}`,
          title: String(item.title).trim().slice(0, 80),
          description:
            typeof item.description === 'string'
              ? item.description.trim().slice(0, 200)
              : '',
          tech:
            typeof item.tech === 'string' && item.tech.trim()
              ? item.tech.trim().slice(0, 60)
              : undefined,
          url: sanitizeSafeWebUrl(item.url),
        }))
    : existing.portfolioItems;

  const updated: PublicProfile = {
    id: user.id,
    name:
      typeof body.name === 'string' && body.name.trim()
        ? body.name.trim().slice(0, 120)
        : existing.name,
    role:
      typeof body.role === 'string' && body.role.trim()
        ? body.role.trim().slice(0, 80)
        : existing.role,
    country:
      typeof body.country === 'string' && body.country.trim()
        ? body.country.trim().slice(0, 80)
        : existing.country,
    headline: cleanHeadline,
    bio: cleanBio,
    skills: cleanSkills,
    portfolioItems: cleanItems,
    githubUrl:
      body.githubUrl !== undefined
        ? sanitizeSafeWebUrl(body.githubUrl)
        : existing.githubUrl,
    websiteUrl:
      body.websiteUrl !== undefined
        ? sanitizeSafeWebUrl(body.websiteUrl)
        : existing.websiteUrl,
    availability: nextAvailability,
    updatedAt: new Date().toISOString(),
  };

  profilesStore.set(user.id, updated);
  savePersistedProfiles();
  emitSocketBroadcast('profile:updated', updated);

  return res.json({ success: true, profile: updated });
});

// List invitations for authenticated user (sent & received)
app.get('/api/invitations', requireAuth, (req, res) => {
  const user: StoredUser = (req as any).user;
  const mine = invitationsStore
    .filter((inv) => inv.fromUserId === user.id || inv.toUserId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return res.json({ success: true, invitations: mine });
});

// Send a connection invitation before starting a conversation
app.post('/api/invitations', requireAuth, (req, res) => {
  const user: StoredUser = (req as any).user;
  const { toUserId, note } = req.body || {};

  if (!toUserId || typeof toUserId !== 'string') {
    return res.status(400).json({ success: false, error: 'Destinataire requis.' });
  }
  if (toUserId === user.id) {
    return res.status(400).json({ success: false, error: 'Vous ne pouvez pas vous inviter vous-même.' });
  }

  const recipient = profilesStore.get(toUserId);
  if (!recipient) {
    return res.status(404).json({ success: false, error: 'Profil destinataire introuvable.' });
  }

  const activeExisting = invitationsStore.find(
    (inv) =>
      (inv.status === 'pending' || inv.status === 'accepted') &&
      ((inv.fromUserId === user.id && inv.toUserId === toUserId) ||
        (inv.fromUserId === toUserId && inv.toUserId === user.id))
  );

  if (activeExisting) {
    return res.status(409).json({
      success: false,
      error:
        activeExisting.status === 'accepted'
          ? 'Vous êtes déjà connectés et pouvez discuter.'
          : 'Une invitation est déjà en attente entre vous.',
      invitation: activeExisting,
    });
  }

  const senderProfile = ensurePublicProfileForUser(user);
  const newInvite: ConnectionInvite = {
    id: `inv-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    fromUserId: user.id,
    fromUserName: senderProfile.name,
    fromUserRole: senderProfile.role,
    fromUserCountry: senderProfile.country,
    toUserId: recipient.id,
    toUserName: recipient.name,
    toUserRole: recipient.role,
    toUserCountry: recipient.country,
    note: typeof note === 'string' && note.trim() ? note.trim().slice(0, 200) : undefined,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  invitationsStore.unshift(newInvite);
  savePersistedInvitations();
  emitSocketToUsers([user.id, recipient.id], 'invite:created', newInvite);

  return res.json({ success: true, invitation: newInvite });
});

// Accept, decline, or cancel an invitation
app.patch('/api/invitations/:id', requireAuth, (req, res) => {
  const user: StoredUser = (req as any).user;
  const { id } = req.params;
  const { action } = req.body || {};

  const idx = invitationsStore.findIndex((inv) => inv.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Invitation introuvable.' });
  }

  const invite = invitationsStore[idx];

  if (action === 'cancel') {
    if (invite.fromUserId !== user.id || invite.status !== 'pending') {
      return res.status(403).json({ success: false, error: 'Action non autorisée.' });
    }
    invitationsStore.splice(idx, 1);
    savePersistedInvitations();
    emitSocketToUsers([invite.fromUserId, invite.toUserId], 'invite:removed', { id });
    return res.json({ success: true, removedId: id });
  }

  if (action !== 'accepted' && action !== 'declined') {
    return res.status(400).json({ success: false, error: 'Action invalide.' });
  }

  if (invite.toUserId !== user.id) {
    return res.status(403).json({
      success: false,
      error: 'Seul le destinataire peut accepter ou refuser cette invitation.',
    });
  }

  if (invite.status !== 'pending') {
    return res.status(400).json({ success: false, error: 'Cette invitation a déjà reçu une réponse.' });
  }

  const updated: ConnectionInvite = {
    ...invite,
    status: action,
    respondedAt: new Date().toISOString(),
  };
  invitationsStore[idx] = updated;
  savePersistedInvitations();
  emitSocketToUsers([invite.fromUserId, invite.toUserId], 'invite:updated', updated);

  return res.json({ success: true, invitation: updated });
});

// Get short text messages for an accepted conversation (or all conversations)
app.get('/api/messages', requireAuth, (req, res) => {
  const user: StoredUser = (req as any).user;
  const peerId = typeof req.query.peerId === 'string' ? req.query.peerId.trim() : '';

  if (peerId) {
    if (!hasAcceptedInviteBetween(user.id, peerId)) {
      return res.status(403).json({
        success: false,
        error: "Une invitation acceptée est requise pour consulter cette conversation.",
      });
    }
    const convId = makeConversationId(user.id, peerId);
    const thread = messagesStore
      .filter((m) => m.conversationId === convId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return res.json({ success: true, messages: thread });
  }

  const mine = messagesStore
    .filter((m) => m.senderId === user.id || m.recipientId === user.id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return res.json({ success: true, messages: mine });
});

// Send a short text message (strictly requires accepted invitation)
app.post('/api/messages', requireAuth, (req, res) => {
  const user: StoredUser = (req as any).user;
  const { recipientId, text } = req.body || {};

  if (!recipientId || typeof recipientId !== 'string') {
    return res.status(400).json({ success: false, error: 'Destinataire requis.' });
  }
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ success: false, error: 'Le message texte ne peut pas être vide.' });
  }

  const cleanText = text.trim();
  if (cleanText.length > 500) {
    return res.status(400).json({
      success: false,
      error: 'Message limité à 500 caractères pour des échanges courts et efficaces.',
    });
  }

  if (!hasAcceptedInviteBetween(user.id, recipientId)) {
    return res.status(403).json({
      success: false,
      error: 'Invitation requise : le destinataire doit accepter votre invitation avant de discuter.',
    });
  }

  const senderProfile = ensurePublicProfileForUser(user);
  const newMsg: DirectMessage = {
    id: `msg-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    conversationId: makeConversationId(user.id, recipientId),
    senderId: user.id,
    senderName: senderProfile.name,
    recipientId,
    text: cleanText,
    createdAt: new Date().toISOString(),
  };

  messagesStore.push(newMsg);
  if (messagesStore.length > 5000) {
    messagesStore = messagesStore.slice(-5000);
  }
  savePersistedMessages();
  emitSocketToUsers([user.id, recipientId], 'message:created', newMsg);

  return res.json({ success: true, message: newMsg });
});

// ================= VITE DEV MIDDLEWARE & PRODUCTION =================
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const httpServer = http.createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/social' });

  wss.on('connection', (ws) => {
    let authedUserId: string | null = null;
    allSocketsSet.add(ws);

    ws.on('message', async (raw) => {
      try {
        const parsed = JSON.parse(raw.toString());
        if (parsed?.type === 'auth' && typeof parsed.token === 'string') {
          const user = await resolveUserByToken(parsed.token);
          if (user) {
            authedUserId = user.id;
            if (!userSocketsMap.has(user.id)) {
              userSocketsMap.set(user.id, new Set());
            }
            userSocketsMap.get(user.id)!.add(ws);
            ws.send(JSON.stringify({ event: 'auth:ok', payload: { userId: user.id } }));
          }
        }
      } catch {
        // Ignore malformed frames
      }
    });

    ws.on('close', () => {
      allSocketsSet.delete(ws);
      if (authedUserId) {
        const set = userSocketsMap.get(authedUserId);
        if (set) {
          set.delete(ws);
          if (set.size === 0) userSocketsMap.delete(authedUserId);
        }
      }
    });
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`tomorrow server active on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
