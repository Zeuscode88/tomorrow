import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { AppIdea, AppStatus } from '../types/app';
import { User } from '../types/auth';
import { CountryFlagIcon } from '../utils/countryIcons';
import { getAppIcon } from '../utils/icons';
import { AfricaContinentIcon } from '../utils/africanIcons';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  authToken: string | null;
  onShowToast: (msg: string) => void;
  onRefreshApps: () => void;
  onSelectApp: (app: AppIdea) => void;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  country: string;
  createdAt: string;
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

interface AdminStats {
  totalApps: number;
  dailyApps: number;
  totalVotes: number;
  totalPledges: number;
  totalUsers: number;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  authToken,
  onShowToast,
  onRefreshApps,
  onSelectApp,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'apps' | 'pledges' | 'users'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [apps, setApps] = useState<AppIdea[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pledges, setPledges] = useState<AdminPledge[]>([]);
  const [searchAppQuery, setSearchAppQuery] = useState('');
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const isAdmin = currentUser?.email.toLowerCase() === 'jonatha2ngs@gmail.com';

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
        <div className="relative w-full max-w-md rounded-3xl border border-rose-200 dark:border-rose-900 bg-white dark:bg-zinc-900 p-7 text-center shadow-2xl">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
            <ShieldAlert className="h-7 w-7" />
          </div>

          <h2 className="mt-4 text-lg font-black text-slate-900 dark:text-white">Accès Administrateur Refusé</h2>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            Ce dashboard administratif est strictement réservé au compte{' '}
            <strong className="text-black dark:text-white font-bold">jonatha2ngs@gmail.com</strong>.
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

  const handleDeleteApp = async (appId: string, title: string) => {
    if (!window.confirm(`Confirmez-vous la suppression définitive de l'application "${title}" ?`)) {
      return;
    }

    setActionInProgress(appId);
    try {
      const res = await fetch(`/api/admin/apps/${appId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.success) {
        setApps((prev) => prev.filter((a) => a.id !== appId));
        onShowToast(`Application "${title}" supprimée.`);
        onRefreshApps();
      }
    } catch {
      onShowToast('Erreur lors de la suppression.');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDeletePledge = async (appId: string, pledgeId: string, devName: string) => {
    if (!window.confirm(`Retirer l'engagement développeur de "${devName}" ?`)) return;

    try {
      const res = await fetch(`/api/admin/pledges/${appId}/${pledgeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.success) {
        setPledges((prev) => prev.filter((p) => p.id !== pledgeId));
        onShowToast(`Engagement de ${devName} retiré.`);
        onRefreshApps();
      }
    } catch {
      onShowToast('Erreur lors de la suppression.');
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!window.confirm(`Supprimer le compte de l'utilisateur "${email}" ?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        onShowToast(`Utilisateur ${email} supprimé.`);
      } else {
        onShowToast(data.error || 'Erreur.');
      }
    } catch {
      onShowToast('Erreur lors de la suppression.');
    }
  };

  const handleExportJSON = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      admin: currentUser.email,
      stats,
      apps,
      users,
      pledges,
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
    onShowToast('Export JSON généré et téléchargé.');
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
      u.role.toLowerCase().includes(searchUserQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-7 md:p-8 shadow-2xl my-4 sm:my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Retour</span>
            </button>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black dark:bg-white text-white dark:text-black shadow-xs">
              <ShieldCheck className="h-6 w-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  Dashboard Administratif
                </h2>
                <span className="rounded-md bg-black dark:bg-white px-2 py-0.5 text-[10px] font-bold text-white dark:text-black uppercase tracking-wider">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Accès exclusif : <span className="font-bold text-slate-900 dark:text-white">jonatha2ngs@gmail.com</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-black dark:hover:border-white transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export JSON</span>
            </button>

            <button
              type="button"
              onClick={fetchAdminData}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-800"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Global KPIs */}
        {stats && (
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-3 text-center">
              <div className="text-xl font-black text-slate-900 dark:text-white">{stats.totalApps}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Applications</div>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-3 text-center">
              <div className="text-xl font-black text-amber-700 dark:text-amber-400">{stats.dailyApps}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Drop IA actifs</div>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-3 text-center">
              <div className="text-xl font-black text-slate-900 dark:text-white">{stats.totalVotes}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Votes citoyens</div>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-3 text-center">
              <div className="text-xl font-black text-emerald-700 dark:text-emerald-400">{stats.totalPledges}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Pledges Dev</div>
            </div>
            <div className="col-span-2 sm:col-span-1 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-3 text-center">
              <div className="text-xl font-black text-slate-900 dark:text-white">{stats.totalUsers}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Comptes</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mt-5 flex border-b border-slate-200 dark:border-zinc-800 text-xs font-bold gap-1 sm:gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 border-b-2 py-2.5 px-3 whitespace-nowrap transition-colors ${
              activeTab === 'overview'
                ? 'border-black dark:border-white text-black dark:text-white'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Vue d'ensemble</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('apps')}
            className={`flex items-center gap-1.5 border-b-2 py-2.5 px-3 whitespace-nowrap transition-colors ${
              activeTab === 'apps'
                ? 'border-black dark:border-white text-black dark:text-white'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Applications ({apps.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pledges')}
            className={`flex items-center gap-1.5 border-b-2 py-2.5 px-3 whitespace-nowrap transition-colors ${
              activeTab === 'pledges'
                ? 'border-black dark:border-white text-black dark:text-white'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Code className="h-3.5 w-3.5" />
            <span>Engagements ({pledges.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-1.5 border-b-2 py-2.5 px-3 whitespace-nowrap transition-colors ${
              activeTab === 'users'
                ? 'border-black dark:border-white text-black dark:text-white'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Utilisateurs ({users.length})</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto pt-4 space-y-4 pr-1">
          {activeTab === 'overview' && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-4">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                  Privilèges de gestion administrateur
                </h3>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-disc pl-4 font-medium">
                  <li>Contrôle total sur le catalogue africain d'applications (Drop IA, statuts, suppressions).</li>
                  <li>Modération des engagements de développement et coordonnées de contact.</li>
                  <li>Supervision des comptes utilisateurs inscrits et export des données JSON.</li>
                  <li>Accès strictement scellé et authentifié avec l'adresse : <strong>jonatha2ngs@gmail.com</strong>.</li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-3">Raccourcis de gestion rapide :</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('apps')}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-left hover:border-black dark:hover:border-white transition-colors"
                  >
                    <Layers className="h-5 w-5 mb-2 text-black dark:text-white" />
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Gérer les applications</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Modifier statut ou supprimer</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('pledges')}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-left hover:border-black dark:hover:border-white transition-colors"
                  >
                    <Code className="h-5 w-5 mb-2 text-black dark:text-white" />
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Modérer les pledges</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Consulter les profils devs</div>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportJSON}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-left hover:border-black dark:hover:border-white transition-colors"
                  >
                    <Download className="h-5 w-5 mb-2 text-black dark:text-white" />
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Sauvegarde globale</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Télécharger le fichier JSON</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'apps' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filtrer les applications par titre, pays ou secteur..."
                  value={searchAppQuery}
                  onChange={(e) => setSearchAppQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-black dark:focus:border-white focus:outline-none"
                />
              </div>

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
                            ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
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
                        <option value="Recherche Développeurs">Recherche Développeurs</option>
                        <option value="Prototypage en cours">Prototypage en cours</option>
                        <option value="MVP Prêt">MVP Prêt</option>
                        <option value="Déployée">Déployée</option>
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
                        onClick={() => handleDeleteApp(app.id, app.title)}
                        className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/50 p-1.5 text-rose-600 dark:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                      onClick={() => handleDeletePledge(p.appId, p.id, p.name)}
                      className="self-end sm:self-auto flex items-center gap-1 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-1 text-[11px] font-bold text-rose-600 dark:text-rose-400"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Retirer</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, email ou rôle..."
                  value={searchUserQuery}
                  onChange={(e) => setSearchUserQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-black dark:focus:border-white focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                {filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3"
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
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">{u.email}</p>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        Inscrit le {new Date(u.createdAt).toLocaleDateString('fr-FR')} {u.country ? `· ${u.country}` : ''}
                      </div>
                    </div>

                    {!u.isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u.id, u.email)}
                        className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/50 p-1.5 text-rose-600 dark:text-rose-400 shrink-0"
                        title="Supprimer ce compte"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
