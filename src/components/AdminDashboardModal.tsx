import React, { useEffect, useState } from 'react';
import {
  X,
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  Layers,
  Users,
  Code,
  Trash2,
  Search,
  Download,
  ExternalLink,
  RefreshCw,
  SlidersHorizontal,
  Boxes,
  MessageSquare,
  Plus,
  KeyRound,
  Ban,
  CheckCircle2,
  Copy,
  AlertTriangle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { AppIdea, AppStatus, Sector } from '../types/app';
import { ProjectBuild } from '../types/builder';
import { User, USER_ROLES } from '../types/auth';
import { PlatformSettings } from '../types/notes';
import { CountryFlagIcon } from '../utils/countryIcons';
import { getAppIcon } from '../utils/icons';
import { AfricaContinentIcon } from '../utils/africanIcons';
import { isAdminEmail, ADMIN_EMAILS } from '../utils/adminAuth';
import { AFRICAN_COUNTRIES, DEFAULT_AFRICAN_COUNTRY } from '../data/africanCountries';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  authToken: string | null;
  onShowToast: (msg: string) => void;
  onRefreshApps: () => void;
  onSelectApp: (app: AppIdea) => void;
  onSettingsUpdated?: (settings: PlatformSettings) => void;
  onRefreshBuilds?: () => void;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  country: string;
  createdAt: string;
  suspended?: boolean;
  isAdmin: boolean;
}

interface AdminPledge {
  id: string;
  name: string;
  role: string;
  country: string;
  githubOrContact?: string;
  comment: string;
  createdAt: string;
  userEmail?: string;
  appId: string;
  appTitle: string;
  appCountry: string;
}

interface AdminComment {
  id: string;
  author: string;
  role: string;
  text: string;
  createdAt: string;
  appId: string;
  appTitle: string;
  appCountry: string;
}

interface AdminStats {
  totalApps: number;
  dailyApps: number;
  totalVotes: number;
  totalPledges: number;
  totalUsers: number;
  totalBuilds?: number;
  totalComments?: number;
  totalProfiles?: number;
  totalInvitations?: number;
  totalMessages?: number;
}

type AdminTab = 'overview' | 'apps' | 'builds' | 'pledges' | 'users' | 'comments';

type PendingDelete =
  | { type: 'app'; id: string; label: string }
  | { type: 'pledge'; appId: string; pledgeId: string; label: string }
  | { type: 'user'; userId: string; label: string }
  | { type: 'build'; buildId: string; label: string }
  | { type: 'comment'; appId: string; commentId: string; label: string };

const SECTORS: Sector[] = [
  'Agriculture & Alimentation',
  'Santé & Urgence',
  'Éducation & Langues',
  'Inclusion Financière & Tontines',
  'Énergie, Eau & Climat',
  'Mobilité & Logistique',
  'Artisanat, Commerce & Tourisme',
  'Citoyenneté & Droits',
];

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  authToken,
  onShowToast,
  onRefreshApps,
  onSelectApp,
  onSettingsUpdated,
  onRefreshBuilds,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [apps, setApps] = useState<AppIdea[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pledges, setPledges] = useState<AdminPledge[]>([]);
  const [builds, setBuilds] = useState<ProjectBuild[]>([]);
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [settings, setSettings] = useState<PlatformSettings>({
    announcementBanner: '',
    maintenanceMode: false,
    allowRegistrations: true,
    allowAIGeneration: true,
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const [searchAppQuery, setSearchAppQuery] = useState('');
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [searchCommentQuery, setSearchCommentQuery] = useState('');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);

  // Issued OTP reset code banner for Super Admin
  const [issuedResetInfo, setIssuedResetInfo] = useState<{
    email: string;
    code: string;
    expiresAt: number;
  } | null>(null);

  // New App Creation inline form
  const [showCreateAppForm, setShowCreateAppForm] = useState(false);
  const [newAppTitle, setNewAppTitle] = useState('');
  const [newAppTagline, setNewAppTagline] = useState('');
  const [newAppCountry, setNewAppCountry] = useState(DEFAULT_AFRICAN_COUNTRY);
  const [newAppSector, setNewAppSector] = useState<Sector>('Citoyenneté & Droits');
  const [newAppProblem, setNewAppProblem] = useState('');
  const [newAppIsDaily, setNewAppIsDaily] = useState(false);
  const [isCreatingApp, setIsCreatingApp] = useState(false);

  const isAdmin = isAdminEmail(currentUser?.email);

  const fetchAdminData = async () => {
    if (!isAdmin || !authToken) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/overview', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setApps(data.apps || []);
        setUsers(data.users || []);
        setPledges(data.pledges || []);
        setBuilds(data.builds || []);
        setComments(data.comments || []);
        if (data.settings) setSettings(data.settings);
      } else {
        onShowToast(data.error || 'Erreur lors du chargement des données admin.');
      }
    } catch {
      onShowToast("Erreur réseau lors de l'accès au dashboard.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && isAdmin) {
      fetchAdminData();
    }
  }, [isOpen, isAdmin, authToken]);

  if (!isOpen) return null;

  if (!currentUser || !isAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs">
        <div className="relative w-full max-w-md rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-7 text-center shadow-2xl">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-black dark:bg-white text-white dark:text-black">
            <ShieldAlert className="h-7 w-7" />
          </div>

          <h2 className="mt-4 text-lg font-black text-slate-900 dark:text-white">
            Accès Administrateur Refusé
          </h2>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            Ce tableau de bord de gestion est réservé aux administrateurs habilités (
            <strong className="text-black dark:text-white">{ADMIN_EMAILS.join(' · ')}</strong>).
          </p>

          <div className="mt-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
            Compte actuel : {currentUser ? currentUser.email : 'Non connecté'}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full rounded-xl bg-black dark:bg-white py-2.5 text-xs font-bold text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) return;
    setIsSavingSettings(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
        onSettingsUpdated?.(data.settings);
        onShowToast('Paramètres globaux de la plateforme enregistrés.');
      } else {
        onShowToast(data.error || 'Impossible de enregistrer les paramètres.');
      }
    } catch {
      onShowToast('Erreur réseau.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken || !newAppTitle.trim() || !newAppProblem.trim()) return;
    setIsCreatingApp(true);
    try {
      const res = await fetch('/api/admin/apps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: newAppTitle.trim(),
          tagline: newAppTagline.trim() || newAppTitle.trim(),
          country: newAppCountry,
          sector: newAppSector,
          problemSolved: newAppProblem.trim(),
          isDailyDrop: newAppIsDaily,
        }),
      });
      const data = await res.json();
      if (data.success && data.app) {
        setApps((prev) => [data.app, ...prev]);
        setNewAppTitle('');
        setNewAppTagline('');
        setNewAppProblem('');
        setNewAppIsDaily(false);
        setShowCreateAppForm(false);
        onRefreshApps();
        onShowToast(`Application « ${data.app.title} » ajoutée au catalogue.`);
      } else {
        onShowToast(data.error || 'Erreur lors de la création.');
      }
    } catch {
      onShowToast('Erreur réseau.');
    } finally {
      setIsCreatingApp(false);
    }
  };

  const handleToggleDailyDrop = async (appId: string, currentVal: boolean) => {
    setActionInProgress(appId);
    try {
      const res = await fetch(`/api/admin/apps/${appId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ isDailyDrop: !currentVal }),
      });
      const data = await res.json();
      if (data.success) {
        setApps((prev) =>
          prev.map((a) => (a.id === appId ? { ...a, isDailyDrop: !currentVal } : a))
        );
        onShowToast(`Statut Drop IA mis à jour pour ${data.app.title}`);
        onRefreshApps();
      }
    } catch {
      onShowToast('Erreur lors de la mise à jour.');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleChangeStatus = async (appId: string, status: AppStatus) => {
    setActionInProgress(appId);
    try {
      const res = await fetch(`/api/admin/apps/${appId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setApps((prev) => prev.map((a) => (a.id === appId ? { ...a, status } : a)));
        onShowToast(`Statut mis à jour : ${status}`);
        onRefreshApps();
      }
    } catch {
      onShowToast('Erreur lors de la mise à jour.');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleToggleBuildVisibility = async (build: ProjectBuild) => {
    setActionInProgress(build.id);
    try {
      const res = await fetch(`/api/admin/builds/${build.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ isPublic: !build.isPublic }),
      });
      const data = await res.json();
      if (data.success && data.build) {
        setBuilds((prev) => prev.map((b) => (b.id === build.id ? data.build : b)));
        onRefreshBuilds?.();
        onShowToast(
          data.build.isPublic ? 'Rendu build rendu public.' : 'Rendu build masqué du public.'
        );
      }
    } catch {
      onShowToast('Erreur réseau.');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleChangeBuildStage = async (buildId: string, progressStage: string) => {
    setActionInProgress(buildId);
    try {
      const res = await fetch(`/api/admin/builds/${buildId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ progressStage }),
      });
      const data = await res.json();
      if (data.success && data.build) {
        setBuilds((prev) => prev.map((b) => (b.id === buildId ? data.build : b)));
        onRefreshBuilds?.();
        onShowToast(`Avancement mis à jour : ${progressStage}`);
      }
    } catch {
      onShowToast('Erreur réseau.');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleUpdateUserRole = async (userId: string, role: string) => {
    setActionInProgress(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? data.user : u)));
        onShowToast(`Rôle mis à jour pour ${data.user.name}.`);
      } else {
        onShowToast(data.error || 'Action refusée.');
      }
    } catch {
      onShowToast('Erreur réseau.');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleToggleUserSuspended = async (u: AdminUser) => {
    setActionInProgress(u.id);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ suspended: !u.suspended }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUsers((prev) => prev.map((x) => (x.id === u.id ? data.user : x)));
        onShowToast(
          data.user.suspended
            ? `Compte ${u.email} suspendu.`
            : `Compte ${u.email} réactivé.`
        );
      } else {
        onShowToast(data.error || 'Action impossible.');
      }
    } catch {
      onShowToast('Erreur réseau.');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleIssuePasswordResetCode = async (u: AdminUser) => {
    setActionInProgress(u.id);
    try {
      const res = await fetch(`/api/admin/users/${u.id}/reset-code`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.success && data.code) {
        setIssuedResetInfo({
          email: data.email,
          code: data.code,
          expiresAt: data.expiresAt,
        });
        onShowToast(`Code de récupération généré pour ${data.email}.`);
      } else {
        onShowToast(data.error || 'Erreur de génération du code.');
      }
    } catch {
      onShowToast('Erreur réseau.');
    } finally {
      setActionInProgress(null);
    }
  };

  const executeConfirmedDelete = async () => {
    if (!pendingDelete || !authToken) {
      setPendingDelete(null);
      return;
    }

    const item = pendingDelete;
    setPendingDelete(null);

    try {
      if (item.type === 'app') {
        const res = await fetch(`/api/admin/apps/${item.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await res.json();
        if (data.success) {
          setApps((prev) => prev.filter((a) => a.id !== item.id));
          onShowToast(`Application « ${item.label} » supprimée.`);
          onRefreshApps();
        }
      } else if (item.type === 'pledge') {
        const res = await fetch(`/api/admin/pledges/${item.appId}/${item.pledgeId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await res.json();
        if (data.success) {
          setPledges((prev) => prev.filter((p) => p.id !== item.pledgeId));
          onShowToast(`Engagement de ${item.label} retiré.`);
          onRefreshApps();
        }
      } else if (item.type === 'user') {
        const res = await fetch(`/api/admin/users/${item.userId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await res.json();
        if (data.success) {
          setUsers((prev) => prev.filter((u) => u.id !== item.userId));
          onShowToast(`Utilisateur ${item.label} supprimé.`);
        } else {
          onShowToast(data.error || 'Suppression refusée.');
        }
      } else if (item.type === 'build') {
        const res = await fetch(`/api/admin/builds/${item.buildId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await res.json();
        if (data.success) {
          setBuilds((prev) => prev.filter((b) => b.id !== item.buildId));
          onRefreshBuilds?.();
          onShowToast(`Build « ${item.label} » supprimé.`);
        }
      } else if (item.type === 'comment') {
        const res = await fetch(`/api/admin/comments/${item.appId}/${item.commentId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await res.json();
        if (data.success) {
          setComments((prev) => prev.filter((c) => c.id !== item.commentId));
          onRefreshApps();
          onShowToast('Commentaire supprimé.');
        }
      }
    } catch {
      onShowToast('Erreur réseau lors de la suppression.');
    }
  };

  const handleExportJSON = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      admin: currentUser.email,
      stats,
      settings,
      apps,
      builds,
      users,
      pledges,
      comments,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tomorrow_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    onShowToast('Export JSON complet généré et téléchargé.');
  };

  const filteredApps = apps.filter(
    (a) =>
      a.title.toLowerCase().includes(searchAppQuery.toLowerCase()) ||
      a.country.toLowerCase().includes(searchAppQuery.toLowerCase()) ||
      a.sector.toLowerCase().includes(searchAppQuery.toLowerCase())
  );

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
      (u.country || '').toLowerCase().includes(searchUserQuery.toLowerCase())
  );

  const filteredComments = comments.filter(
    (c) =>
      c.author.toLowerCase().includes(searchCommentQuery.toLowerCase()) ||
      c.text.toLowerCase().includes(searchCommentQuery.toLowerCase()) ||
      c.appTitle.toLowerCase().includes(searchCommentQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-6xl rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 sm:p-5 md:p-6 shadow-2xl my-2 sm:my-4 max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 border-b border-slate-200 dark:border-zinc-800 pb-3 sm:pb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-700 shrink-0"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Retour</span>
            </button>

            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-black dark:bg-white text-white dark:text-black shadow-xs">
              <ShieldCheck className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <h2 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white truncate">
                  Dashboard Administrateur
                </h2>
                <span className="rounded-md bg-black dark:bg-white px-1.5 py-0.5 text-[9.5px] font-bold text-white dark:text-black uppercase tracking-wider shrink-0">
                  Super Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                Session active :{' '}
                <span className="font-bold text-slate-900 dark:text-white">{currentUser.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={handleExportJSON}
              className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:border-black dark:hover:border-white transition-colors whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export JSON</span>
            </button>

            <button
              type="button"
              onClick={fetchAdminData}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-800"
              aria-label="Actualiser"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white"
              aria-label="Fermer"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>

        {/* Global KPIs */}
        {stats && (
          <div className="mt-3 grid grid-cols-4 lg:grid-cols-8 gap-1.5">
            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-2 text-center">
              <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white tabular-nums">{stats.totalApps}</div>
              <div className="text-[9.5px] text-slate-500 dark:text-slate-400 font-semibold truncate">Apps</div>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-2 text-center">
              <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white tabular-nums">{stats.dailyApps}</div>
              <div className="text-[9.5px] text-slate-500 dark:text-slate-400 font-semibold truncate">Drop IA</div>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-2 text-center">
              <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white tabular-nums">{stats.totalVotes}</div>
              <div className="text-[9.5px] text-slate-500 dark:text-slate-400 font-semibold truncate">Votes</div>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-2 text-center">
              <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white tabular-nums">{stats.totalBuilds ?? builds.length}</div>
              <div className="text-[9.5px] text-slate-500 dark:text-slate-400 font-semibold truncate">Builds</div>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-2 text-center">
              <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white tabular-nums">{stats.totalPledges}</div>
              <div className="text-[9.5px] text-slate-500 dark:text-slate-400 font-semibold truncate">Pledges</div>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-2 text-center">
              <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white tabular-nums">{stats.totalUsers}</div>
              <div className="text-[9.5px] text-slate-500 dark:text-slate-400 font-semibold truncate">Comptes</div>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-2 text-center">
              <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white tabular-nums">{stats.totalComments ?? comments.length}</div>
              <div className="text-[9.5px] text-slate-500 dark:text-slate-400 font-semibold truncate">Avis</div>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-2 text-center">
              <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white tabular-nums">{stats.totalMessages ?? 0}</div>
              <div className="text-[9.5px] text-slate-500 dark:text-slate-400 font-semibold truncate">Messages</div>
            </div>
          </div>
        )}

        {/* Tabs — all 6 tabs visible simultaneously on every screen size */}
        <div className="mt-3 grid grid-cols-3 sm:flex sm:flex-wrap border-b border-slate-200 dark:border-zinc-800 text-[10px] sm:text-[11px] font-bold gap-1 pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center justify-center sm:justify-start gap-1 border-b-2 py-2 px-1.5 sm:px-2.5 whitespace-nowrap transition-colors ${
              activeTab === 'overview'
                ? 'border-black dark:border-white text-black dark:text-white'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <SlidersHorizontal className="h-3 w-3 shrink-0" />
            <span className="truncate">Plateforme</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('apps')}
            className={`flex items-center justify-center sm:justify-start gap-1 border-b-2 py-2 px-1.5 sm:px-2.5 whitespace-nowrap transition-colors ${
              activeTab === 'apps'
                ? 'border-black dark:border-white text-black dark:text-white'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="h-3 w-3 shrink-0" />
            <span className="truncate">Apps ({apps.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('builds')}
            className={`flex items-center justify-center sm:justify-start gap-1 border-b-2 py-2 px-1.5 sm:px-2.5 whitespace-nowrap transition-colors ${
              activeTab === 'builds'
                ? 'border-black dark:border-white text-black dark:text-white'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Boxes className="h-3 w-3 shrink-0" />
            <span className="truncate">Builds ({builds.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pledges')}
            className={`flex items-center justify-center sm:justify-start gap-1 border-b-2 py-2 px-1.5 sm:px-2.5 whitespace-nowrap transition-colors ${
              activeTab === 'pledges'
                ? 'border-black dark:border-white text-black dark:text-white'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Code className="h-3 w-3 shrink-0" />
            <span className="truncate">Pledges ({pledges.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`flex items-center justify-center sm:justify-start gap-1 border-b-2 py-2 px-1.5 sm:px-2.5 whitespace-nowrap transition-colors ${
              activeTab === 'users'
                ? 'border-black dark:border-white text-black dark:text-white'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="h-3 w-3 shrink-0" />
            <span className="truncate">Comptes ({users.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('comments')}
            className={`flex items-center justify-center sm:justify-start gap-1 border-b-2 py-2 px-1.5 sm:px-2.5 whitespace-nowrap transition-colors ${
              activeTab === 'comments'
                ? 'border-black dark:border-white text-black dark:text-white'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MessageSquare className="h-3 w-3 shrink-0" />
            <span className="truncate">Avis ({comments.length})</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto pt-4 space-y-4 pr-1">
          {/* TAB 1: OVERVIEW & GLOBAL PLATFORM CONTROLS */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              <form
                onSubmit={handleSaveSettings}
                className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-4 sm:p-5 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Pilotage Global de la Plateforme
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Supervisez l’annonce officielle, la maintenance, les inscriptions et la génération IA.
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="rounded-xl bg-black dark:bg-white px-4 py-2 text-xs font-bold text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50"
                  >
                    {isSavingSettings ? 'Enregistrement...' : 'Appliquer les réglages'}
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Bannière d’annonce globale (laisser vide pour masquer)
                  </label>
                  <input
                    type="text"
                    maxLength={300}
                    value={settings.announcementBanner}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, announcementBanner: e.target.value }))
                    }
                    placeholder="Ex: Hackathon Pan-Africain tomorrow ce week-end !"
                    className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-black dark:focus:border-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <label className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 cursor-pointer">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Autoriser les inscriptions
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.allowRegistrations}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, allowRegistrations: e.target.checked }))
                      }
                      className="h-4 w-4 accent-black dark:accent-white"
                    />
                  </label>

                  <label className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 cursor-pointer">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Génération IA ouverte
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.allowAIGeneration}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, allowAIGeneration: e.target.checked }))
                      }
                      className="h-4 w-4 accent-black dark:accent-white"
                    />
                  </label>

                  <label className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 cursor-pointer">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Mode Maintenance
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.maintenanceMode}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, maintenanceMode: e.target.checked }))
                      }
                      className="h-4 w-4 accent-black dark:accent-white"
                    />
                  </label>
                </div>
              </form>

              <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-4">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                  Administrateurs Super Utilisateurs Habilités
                </h3>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-disc pl-4 font-medium">
                  {ADMIN_EMAILS.map((adm) => (
                    <li key={adm}>
                      <strong className="text-black dark:text-white">{adm}</strong> — Accès complet catalogue, builds, modération, comptes & réinitialisation de mots de passe.
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('apps')}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-left hover:border-black dark:hover:border-white transition-colors"
                >
                  <Layers className="h-5 w-5 mb-2 text-black dark:text-white" />
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Applications</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Créer, éditer, Drop IA</div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('builds')}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-left hover:border-black dark:hover:border-white transition-colors"
                >
                  <Boxes className="h-5 w-5 mb-2 text-black dark:text-white" />
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Builds & Rendus</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Visibilité & stades</div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('users')}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-left hover:border-black dark:hover:border-white transition-colors"
                >
                  <Users className="h-5 w-5 mb-2 text-black dark:text-white" />
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Utilisateurs</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Rôles, suspension, codes MDP</div>
                </button>

                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-left hover:border-black dark:hover:border-white transition-colors"
                >
                  <Download className="h-5 w-5 mb-2 text-black dark:text-white" />
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Sauvegarde JSON</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Archive complète</div>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: APPLICATIONS */}
          {activeTab === 'apps' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filtrer les applications par titre, pays ou secteur..."
                    value={searchAppQuery}
                    onChange={(e) => setSearchAppQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-black dark:focus:border-white focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowCreateAppForm((v) => !v)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-black dark:bg-white px-3.5 py-2 text-xs font-bold text-white dark:text-black shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Nouvelle application</span>
                </button>
              </div>

              {showCreateAppForm && (
                <form
                  onSubmit={handleCreateApp}
                  className="rounded-2xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 p-4 space-y-3"
                >
                  <div className="text-xs font-black text-slate-900 dark:text-white">
                    Publier une application officielle au catalogue
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Titre de l'application *"
                      value={newAppTitle}
                      onChange={(e) => setNewAppTitle(e.target.value)}
                      className="rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder="Slogan / Accroche"
                      value={newAppTagline}
                      onChange={(e) => setNewAppTagline(e.target.value)}
                      className="rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                    <select
                      value={newAppCountry}
                      onChange={(e) => setNewAppCountry(e.target.value)}
                      className="rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                    >
                      {AFRICAN_COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <select
                      value={newAppSector}
                      onChange={(e) => setNewAppSector(e.target.value as Sector)}
                      className="rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                    >
                      {SECTORS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    rows={2}
                    required
                    placeholder="Problème résolu et description *"
                    value={newAppProblem}
                    onChange={(e) => setNewAppProblem(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 text-xs text-slate-900 dark:text-white"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={newAppIsDaily}
                        onChange={(e) => setNewAppIsDaily(e.target.checked)}
                        className="h-4 w-4 accent-black dark:accent-white"
                      />
                      <span>Mettre en avant dans le Drop IA</span>
                    </label>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowCreateAppForm(false)}
                        className="rounded-xl border border-slate-300 dark:border-zinc-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        disabled={isCreatingApp}
                        className="rounded-xl bg-black dark:bg-white px-4 py-1.5 text-xs font-bold text-white dark:text-black disabled:opacity-50"
                      >
                        {isCreatingApp ? 'Publication...' : 'Publier'}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {filteredApps.map((app) => (
                  <div
                    key={app.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3.5 hover:border-slate-400 dark:hover:border-zinc-600 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black dark:bg-white text-white dark:text-black">
                        {getAppIcon(app.icon, 'w-5 h-5')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <CountryFlagIcon code={app.countryCode} className="w-3.5 h-2.5" />
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{app.country}</span>
                          <span aria-hidden="true" className="text-slate-300 dark:text-zinc-700">·</span>
                          <span className="truncate">{app.sector}</span>
                          <span aria-hidden="true" className="text-slate-300 dark:text-zinc-700">·</span>
                          <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{app.votes} votes</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{app.title}</h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleToggleDailyDrop(app.id, !!app.isDailyDrop)}
                        disabled={actionInProgress === app.id}
                        className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-bold border transition-colors ${
                          app.isDailyDrop
                            ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                            : 'bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-zinc-700'
                        }`}
                      >
                        <AfricaContinentIcon className="h-3 w-3" />
                        <span>{app.isDailyDrop ? 'Drop Actif' : '+ Drop IA'}</span>
                      </button>

                      <select
                        value={app.status}
                        onChange={(e) => handleChangeStatus(app.id, e.target.value as AppStatus)}
                        className="rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-[11px] font-semibold text-slate-800 dark:text-slate-100 focus:border-black dark:focus:border-white focus:outline-none"
                      >
                        <option value="Idée IA du Jour">Idée IA du Jour</option>
                        <option value="Recherche Développeurs">Recherche Développeurs</option>
                        <option value="Prototypage en cours">Prototypage en cours</option>
                        <option value="Incubé">Incubé</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onSelectApp(app);
                        }}
                        className="rounded-xl border border-slate-200 dark:border-zinc-700 p-1.5 text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setPendingDelete({ type: 'app', id: app.id, label: app.title })
                        }
                        className="rounded-xl border border-slate-200 dark:border-zinc-700 p-1.5 text-slate-600 dark:text-slate-300 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: COLLABORATIVE BUILDS & WEBVIEW RENDERS */}
          {activeTab === 'builds' && (
            <div className="space-y-2.5">
              {builds.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
                  Aucun build ou rendu WebView/IA publié pour le moment.
                </div>
              ) : (
                builds.map((b) => (
                  <div
                    key={b.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{b.title}</span>
                        <span className="rounded-md bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                          {b.appTitle}
                        </span>
                        <span className="rounded-md border border-slate-200 dark:border-zinc-700 px-2 py-0.5 text-[10px] font-mono text-slate-600 dark:text-slate-300">
                          {b.versions.length} ver. · {b.members.length} membre(s)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                        Par {b.ownerName} · {b.summary || 'Sans description'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleToggleBuildVisibility(b)}
                        disabled={actionInProgress === b.id}
                        className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-bold border ${
                          b.isPublic
                            ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                            : 'bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-zinc-700'
                        }`}
                      >
                        {b.isPublic ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        <span>{b.isPublic ? 'Public' : 'Masqué'}</span>
                      </button>

                      <select
                        value={b.progressStage}
                        onChange={(e) => handleChangeBuildStage(b.id, e.target.value)}
                        className="rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-[11px] font-semibold text-slate-800 dark:text-slate-100"
                      >
                        <option value="Concept">Concept</option>
                        <option value="Prototype">Prototype</option>
                        <option value="Alpha">Alpha</option>
                        <option value="Beta">Beta</option>
                        <option value="Production">Production</option>
                      </select>

                      <button
                        type="button"
                        onClick={() =>
                          setPendingDelete({ type: 'build', buildId: b.id, label: b.title })
                        }
                        className="rounded-xl border border-slate-200 dark:border-zinc-700 p-1.5 text-slate-600 dark:text-slate-300 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: PLEDGES */}
          {activeTab === 'pledges' && (
            <div className="space-y-3">
              {pledges.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Aucun engagement développeur enregistré pour l'instant.
                </div>
              ) : (
                pledges.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{p.name}</span>
                        <span className="rounded-md bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                          {p.role}
                        </span>
                        {p.country && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">({p.country})</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                        Application ciblée : <strong className="text-slate-900 dark:text-white">{p.appTitle}</strong> ({p.appCountry})
                      </p>
                      {p.githubOrContact && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          Contact / GitHub : {p.githubOrContact}
                        </p>
                      )}
                      {p.comment && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-1 bg-slate-50 dark:bg-zinc-900 p-1.5 rounded-lg border border-slate-100 dark:border-zinc-800">
                          "{p.comment}"
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setPendingDelete({
                          type: 'pledge',
                          appId: p.appId,
                          pledgeId: p.id,
                          label: p.name,
                        })
                      }
                      className="self-end sm:self-auto flex items-center gap-1 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Retirer</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 5: USERS MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-3">
              {issuedResetInfo && (
                <div className="rounded-2xl border border-black dark:border-white bg-slate-50 dark:bg-zinc-950 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5 text-xs">
                    <div className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <KeyRound className="h-4 w-4" />
                      <span>Code de récupération généré pour {issuedResetInfo.email}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Valable 15 minutes (expire à{' '}
                      {new Date(issuedResetInfo.expiresAt).toLocaleTimeString('fr-FR')}) · Transmettez ce code à l'utilisateur.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-xl bg-black dark:bg-white px-3 py-1.5 font-mono text-sm font-black tracking-widest text-white dark:text-black">
                      {issuedResetInfo.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(issuedResetInfo.code);
                        onShowToast('Code copié dans le presse-papier.');
                      }}
                      className="rounded-xl border border-slate-300 dark:border-zinc-700 p-2 text-slate-700 dark:text-slate-200"
                      title="Copier le code"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIssuedResetInfo(null)}
                      className="rounded-xl border border-slate-300 dark:border-zinc-700 p-2 text-slate-500"
                      aria-label="Fermer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, email, rôle ou pays..."
                  value={searchUserQuery}
                  onChange={(e) => setSearchUserQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-black dark:focus:border-white focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                {filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{u.name}</span>
                        {u.isAdmin ? (
                          <span className="rounded-md bg-black dark:bg-white px-2 py-0.5 text-[10px] font-bold text-white dark:text-black">
                            Super Admin
                          </span>
                        ) : (
                          <span className="rounded-md bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                            {u.role}
                          </span>
                        )}
                        {u.suspended && (
                          <span className="rounded-md border border-slate-400 dark:border-zinc-600 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-200">
                            Suspendu
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">{u.email}</p>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        Inscrit le {new Date(u.createdAt).toLocaleDateString('fr-FR')} {u.country ? `· ${u.country}` : ''}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                      {!u.isAdmin && (
                        <select
                          value={u.role}
                          disabled={actionInProgress === u.id}
                          onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                          className="rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-[11px] font-semibold text-slate-800 dark:text-slate-100"
                        >
                          {USER_ROLES.filter((r) => r !== 'Administrateur').map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      )}

                      <button
                        type="button"
                        disabled={actionInProgress === u.id}
                        onClick={() => handleIssuePasswordResetCode(u)}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1 text-[11px] font-bold text-slate-800 dark:text-slate-100 hover:border-black dark:hover:border-white"
                        title="Générer un code de réinitialisation à 6 chiffres"
                      >
                        <KeyRound className="h-3 w-3" />
                        <span>Code reset MDP</span>
                      </button>

                      {!u.isAdmin && (
                        <>
                          <button
                            type="button"
                            disabled={actionInProgress === u.id}
                            onClick={() => handleToggleUserSuspended(u)}
                            className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1 text-[11px] font-bold ${
                              u.suspended
                                ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                                : 'border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            {u.suspended ? (
                              <>
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Réactiver</span>
                              </>
                            ) : (
                              <>
                                <Ban className="h-3 w-3" />
                                <span>Suspendre</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setPendingDelete({ type: 'user', userId: u.id, label: u.email })
                            }
                            className="rounded-xl border border-slate-200 dark:border-zinc-700 p-1.5 text-slate-600 dark:text-slate-300 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                            title="Supprimer ce compte"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: COMMENTS MODERATION */}
          {activeTab === 'comments' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filtrer les commentaires par auteur, texte ou application..."
                  value={searchCommentQuery}
                  onChange={(e) => setSearchCommentQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-black dark:focus:border-white focus:outline-none"
                />
              </div>

              {filteredComments.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
                  Aucun commentaire à modérer.
                </div>
              ) : (
                filteredComments.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-bold text-slate-900 dark:text-white">{c.author}</span>
                        <span className="rounded bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                          {c.role}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          sur <strong>{c.appTitle}</strong>
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">{c.text}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setPendingDelete({
                          type: 'comment',
                          appId: c.appId,
                          commentId: c.id,
                          label: c.author,
                        })
                      }
                      className="self-end sm:self-auto inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-zinc-700 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Supprimer</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Monochrome In-App Confirmation Dialog (no window.confirm) */}
      {pendingDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black dark:bg-white text-white dark:text-black shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Confirmation administrateur
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Confirmez-vous la suppression définitive de « <strong>{pendingDelete.label}</strong> » ? Cette action est immédiate.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="rounded-xl border border-slate-300 dark:border-zinc-700 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={executeConfirmedDelete}
                className="rounded-xl bg-black dark:bg-white px-4 py-2 text-xs font-bold text-white dark:text-black"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
