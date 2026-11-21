import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import { ProjectBuild } from '../types/builder';

const BUILDS_COLLECTION = 'builds';

export function sortBuilds(list: ProjectBuild[]): ProjectBuild[] {
  return [...list].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function subscribeToBuilds(callback: (builds: ProjectBuild[]) => void): () => void {
  try {
    const q = query(collection(db, BUILDS_COLLECTION), where('isPublic', '==', true));
    return onSnapshot(
      q,
      (snapshot) => {
        const items: ProjectBuild[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as ProjectBuild;
          if (data && data.id && data.appId && Array.isArray(data.versions)) {
            items.push(data);
          }
        });
        callback(sortBuilds(items));
      },
      (err) => {
        console.warn('Firestore builds onSnapshot notice:', err?.message || err);
      }
    );
  } catch {
    return () => {};
  }
}

export async function fetchBuildsFromApi(appId?: string): Promise<ProjectBuild[]> {
  try {
    const url = appId ? `/api/builds?appId=${encodeURIComponent(appId)}` : '/api/builds';
    const res = await fetch(url);
    const data = await res.json();
    if (data.success && Array.isArray(data.builds)) {
      return sortBuilds(data.builds);
    }
  } catch (err) {
    console.warn('API builds fetch fallback:', err);
  }

  try {
    const q = appId
      ? query(collection(db, BUILDS_COLLECTION), where('isPublic', '==', true), where('appId', '==', appId))
      : query(collection(db, BUILDS_COLLECTION), where('isPublic', '==', true));
    const snap = await getDocs(q);
    const items: ProjectBuild[] = [];
    snap.forEach((d) => items.push(d.data() as ProjectBuild));
    return sortBuilds(items);
  } catch {
    return [];
  }
}

export async function fetchSingleBuild(buildId: string): Promise<ProjectBuild | null> {
  try {
    const res = await fetch(`/api/builds/${encodeURIComponent(buildId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.build) {
        return data.build as ProjectBuild;
      }
    }
  } catch {
    // Fallback to Firestore
  }

  try {
    const snap = await getDoc(doc(db, BUILDS_COLLECTION, buildId));
    if (snap.exists()) {
      return snap.data() as ProjectBuild;
    }
  } catch (err) {
    console.warn('Could not load single build from Firestore:', err);
  }
  return null;
}

export async function syncBuildToFirestore(build: ProjectBuild): Promise<void> {
  try {
    await setDoc(doc(db, BUILDS_COLLECTION, build.id), build, { merge: true });
  } catch (err) {
    console.warn('Firestore build sync note:', err);
  }
}
