import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  ArrowLeft,
  Search,
  Users,
  MailPlus,
  MessageSquare,
  Send,
  Check,
  ExternalLink,
  Briefcase,
  Lock,
  Globe,
  Code2,
} from 'lucide-react';
import {
  AvailabilityStatus,
  ConnectionInvite,
  DirectMessage,
  PublicProfile,
} from '../types/social';
import { User } from '../types/auth';
import { AppIdea } from '../types/app';
import { ProjectBuild } from '../types/builder';
import { fetchPublicProfileDetail } from '../services/socialSync';

export type CommunityHubTab = 'profiles' | 'invites' | 'messages';

interface CommunityHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: CommunityHubTab;
  initialSelectedProfileId?: string | null;
  initialSearchQuery?: string;
  currentUser: User | null;
  profiles: PublicProfile[];
  invitations: ConnectionInvite[];
  messages: DirectMessage[];
  apps: AppIdea[];
  builds: ProjectBuild[];
  onOpenAuth: () => void;
  onOpenMyPortfolio: () => void;
  onSendInvitation: (toUserId: string, note?: string) => Promise<boolean>;
  onRespondInvitation: (
    inviteId: string,
    action: 'accepted' | 'declined' | 'cancel'
  ) => Promise<boolean>;
  onSendMessage: (recipientId: string, text: string) => Promise<boolean>;
  onLoadThread?: (peerId: string) => Promise<void>;
}

const AVAILABILITY_FILTERS: ('Tous' | AvailabilityStatus)[] = [
  'Tous',
  'Disponible',
  'Ouvert aux collabs',
  'Occupé',
];

function formatShortTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export const CommunityHubModal: React.FC<CommunityHubModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'profiles',
  initialSelectedProfileId = null,
  initialSearchQuery = '',
  currentUser,
  profiles,
  invitations,
  messages,
  apps,
  builds,
  onOpenAuth,
  onOpenMyPortfolio,
  onSendInvitation,
  onRespondInvitation,
  onSendMessage,
  onLoadThread,
}) => {
  const [activeTab, setActiveTab] = useState<CommunityHubTab>(initialTab);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [availabilityFilter, setAvailabilityFilter] = useState<'Tous' | AvailabilityStatus>('Tous');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(initialSelectedProfileId);
  const [selectedProfileStats, setSelectedProfileStats] = useState<{
    buildsCount: number;
    pledgesCount: number;
  } | null>(null);
  const [inviteNote, setInviteNote] = useState('');
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(null);
  const [chatText, setChatText] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(initialTab);
    setSelectedProfileId(initialSelectedProfileId || null);
    setSearchQuery(initialSearchQuery || '');
    setInviteNote('');
  }, [isOpen, initialTab, initialSelectedProfileId, initialSearchQuery]);

  // Load extra stats when inspecting a profile
  useEffect(() => {
    if (!isOpen || !selectedProfileId) {
      setSelectedProfileStats(null);
      return;
    }
    let active = true;
    fetchPublicProfileDetail(selectedProfileId).then(({ stats }) => {
      if (active) setSelectedProfileStats(stats);
    });
    return () => {
      active = false;
    };
  }, [isOpen, selectedProfileId]);

  const receivedInvites = useMemo(() => {
    if (!currentUser) return [];
    return invitations.filter((inv) => inv.toUserId === currentUser.id);
  }, [invitations, currentUser]);

  const sentInvites = useMemo(() => {
    if (!currentUser) return [];
    return invitations.filter((inv) => inv.fromUserId === currentUser.id);
  }, [invitations, currentUser]);

  const pendingReceivedCount = useMemo(
    () => receivedInvites.filter((inv) => inv.status === 'pending').length,
    [receivedInvites]
  );

  // Connected peers (ONLY those with an accepted invitation)
  const acceptedPeers = useMemo(() => {
    if (!currentUser) return [];
    const peerMap = new Map<
      string,
      { id: string; name: string; role: string; country: string; invite: ConnectionInvite }
    >();
    invitations
      .filter((inv) => inv.status === 'accepted')
      .forEach((inv) => {
        const isSender = inv.fromUserId === currentUser.id;
        const peerId = isSender ? inv.toUserId : inv.fromUserId;
        const fromProfile = profiles.find((p) => p.id === peerId);
        peerMap.set(peerId, {
          id: peerId,
          name: fromProfile?.name || (isSender ? inv.toUserName : inv.fromUserName),
          role: fromProfile?.role || (isSender ? inv.toUserRole : inv.fromUserRole),
          country: fromProfile?.country || (isSender ? inv.toUserCountry : inv.fromUserCountry),
          invite: inv,
        });
      });
    return Array.from(peerMap.values());
  }, [invitations, currentUser, profiles]);

  useEffect(() => {
    if (activeTab === 'messages' && !selectedPeerId && acceptedPeers.length > 0) {
      setSelectedPeerId(acceptedPeers[0].id);
    }
  }, [activeTab, acceptedPeers, selectedPeerId]);

  useEffect(() => {
    if (activeTab === 'messages' && selectedPeerId && onLoadThread) {
      onLoadThread(selectedPeerId);
    }
  }, [activeTab, selectedPeerId, onLoadThread]);

  const activeThreadMessages = useMemo(() => {
    if (!currentUser || !selectedPeerId) return [];
    return messages
      .filter(
        (m) =>
          (m.senderId === currentUser.id && m.recipientId === selectedPeerId) ||
          (m.senderId === selectedPeerId && m.recipientId === currentUser.id)
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [messages, currentUser, selectedPeerId]);

  useEffect(() => {
    if (activeTab === 'messages' && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTab, activeThreadMessages.length]);

  const filteredProfiles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return profiles.filter((p) => {
      if (availabilityFilter !== 'Tous' && p.availability !== availabilityFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.country.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q) ||
        p.headline.toLowerCase().includes(q) ||
        p.bio.toLowerCase().includes(q) ||
        p.skills.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [profiles, searchQuery, availabilityFilter]);

  const selectedProfile = useMemo(
    () => profiles.find((p) => p.id === selectedProfileId) || null,
    [profiles, selectedProfileId]
  );

  // Active invite relation with selectedProfile
  const getInviteRelation = (otherUserId: string): ConnectionInvite | null => {
    if (!currentUser) return null;
    const active = invitations.find(
      (inv) =>
        (inv.status === 'accepted' || inv.status === 'pending') &&
        ((inv.fromUserId === currentUser.id && inv.toUserId === otherUserId) ||
          (inv.fromUserId === otherUserId && inv.toUserId === currentUser.id))
    );
    return active || null;
  };

  if (!isOpen) return null;

  const handleSendInviteSubmit = async (toUserId: string) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    setIsSendingInvite(true);
    try {
      const ok = await onSendInvitation(toUserId, inviteNote.trim() || undefined);
      if (ok) setInviteNote('');
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleSendChatSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUser || !selectedPeerId || !chatText.trim()) return;
    setIsSendingChat(true);
    try {
      const ok = await onSendMessage(selectedPeerId, chatText.trim());
      if (ok) setChatText('');
    } finally {
      setIsSendingChat(false);
    }
  };

  const selectedPeer = acceptedPeers.find((p) => p.id === selectedPeerId) || null;

  const localStatsForSelected = selectedProfile
    ? {
        buildsCount:
          selectedProfileStats?.buildsCount ??
          builds.filter((b) => b.members.some((m) => m.userId === selectedProfile.id)).length,
        pledgesCount:
          selectedProfileStats?.pledgesCount ??
          apps.filter((a) =>
            (a.devPledges || []).some(
              (dp) => dp.name.toLowerCase() === selectedProfile.name.toLowerCase()
            )
          ).length,
      }
    : { buildsCount: 0, pledgesCount: 0 };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-zinc-800 px-4 sm:px-6 py-3.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => {
                if (activeTab === 'profiles' && selectedProfileId) {
                  setSelectedProfileId(null);
                } else {
                  onClose();
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{activeTab === 'profiles' && selectedProfileId ? 'Annuaire' : 'Retour'}</span>
            </button>

            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                Réseau &amp; Portfolios <span data-no-translate="true" className="lowercase">tomorrow</span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate hidden sm:block">
                Découvrez les profils, envoyez une invitation et échangez en texte court après acceptation.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-black dark:hover:text-white transition-colors"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-200 dark:border-zinc-800 px-3 sm:px-5 py-1 sm:py-0">
          <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setActiveTab('profiles');
                setSelectedProfileId(null);
              }}
              className={`flex items-center gap-1 border-b-2 py-2 sm:py-2.5 px-2 sm:px-3 text-[10.5px] sm:text-[11px] font-bold whitespace-nowrap transition-colors ${
                activeTab === 'profiles'
                  ? 'border-black dark:border-white text-black dark:text-white'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <Users className="h-3 w-3 shrink-0" />
              <span>Portfolios ({profiles.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('invites')}
              className={`flex items-center gap-1 border-b-2 py-2 sm:py-2.5 px-2 sm:px-3 text-[10.5px] sm:text-[11px] font-bold whitespace-nowrap transition-colors ${
                activeTab === 'invites'
                  ? 'border-black dark:border-white text-black dark:text-white'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <MailPlus className="h-3 w-3 shrink-0" />
              <span>Invitations</span>
              {pendingReceivedCount > 0 && (
                <span className="rounded-md bg-black dark:bg-white px-1 py-0.5 text-[9.5px] font-mono font-black text-white dark:text-black">
                  {pendingReceivedCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('messages')}
              className={`flex items-center gap-1 border-b-2 py-2 sm:py-2.5 px-2 sm:px-3 text-[10.5px] sm:text-[11px] font-bold whitespace-nowrap transition-colors ${
                activeTab === 'messages'
                  ? 'border-black dark:border-white text-black dark:text-white'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <MessageSquare className="h-3 w-3 shrink-0" />
              <span>Messages ({acceptedPeers.length})</span>
            </button>
          </div>

          {currentUser && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenMyPortfolio();
              }}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2.5 py-1 text-[10px] sm:text-[11px] font-bold text-slate-900 dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors shrink-0 whitespace-nowrap"
            >
              <Briefcase className="h-3 w-3 shrink-0" />
              <span>Mon portfolio</span>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* TAB 1: PORTFOLIOS & PROFILES */}
          {activeTab === 'profiles' && (
            <>
              {selectedProfile ? (
                <div className="space-y-5">
                  {/* Profile Hero Card */}
                  <div className="rounded-3xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950 p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-black dark:bg-white text-white dark:text-black text-xl font-black">
                          {selectedProfile.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">
                              {selectedProfile.name}
                            </h3>
                            <span className="rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-0.5 text-[10px] font-bold text-slate-800 dark:text-slate-200">
                              {selectedProfile.availability}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                            {selectedProfile.role} · {selectedProfile.country}
                          </p>
                          {selectedProfile.headline && (
                            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white pt-1">
                              {selectedProfile.headline}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 text-xs">
                        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-center">
                          <div className="font-black text-slate-900 dark:text-white">
                            {localStatsForSelected.pledgesCount}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">Engagements</div>
                        </div>
                        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-center">
                          <div className="font-black text-slate-900 dark:text-white">
                            {localStatsForSelected.buildsCount}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">Builds</div>
                        </div>
                      </div>
                    </div>

                    {selectedProfile.bio ? (
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed border-t border-slate-200 dark:border-zinc-800 pt-3">
                        {selectedProfile.bio}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 dark:text-slate-500 italic border-t border-slate-200 dark:border-zinc-800 pt-3">
                        Ce membre n'a pas encore ajouté de présentation détaillée.
                      </p>
                    )}

                    {/* Skills + Links */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProfile.skills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1 text-[11px] font-semibold text-slate-800 dark:text-slate-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        {selectedProfile.githubUrl && (
                          <a
                            href={selectedProfile.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1 text-[11px] font-bold text-slate-900 dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                          >
                            <Code2 className="h-3 w-3" />
                            <span>GitHub</span>
                          </a>
                        )}
                        {selectedProfile.websiteUrl && (
                          <a
                            href={selectedProfile.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1 text-[11px] font-bold text-slate-900 dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                          >
                            <Globe className="h-3 w-3" />
                            <span>Site</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Brief Portfolio Projects */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Réalisations du portfolio ({selectedProfile.portfolioItems.length})
                    </h4>
                    {selectedProfile.portfolioItems.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 dark:border-zinc-700 p-5 text-center text-xs text-slate-500 dark:text-slate-400">
                        Aucune réalisation ajoutée pour l'instant.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedProfile.portfolioItems.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                                {item.title}
                              </h5>
                              {item.url && (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="rounded-lg border border-slate-200 dark:border-zinc-700 p-1.5 text-slate-700 dark:text-slate-200 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors shrink-0"
                                  title="Ouvrir le lien du projet"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                            {item.tech && (
                              <div className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                                {item.tech}
                              </div>
                            )}
                            {item.description && (
                              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                {item.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Connection / Messaging Action Box */}
                  <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
                    {currentUser && selectedProfile.id === currentUser.id ? (
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          C'est votre fiche publique sur <span data-no-translate="true" className="lowercase font-black">tomorrow</span>.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenMyPortfolio();
                          }}
                          className="rounded-xl bg-black dark:bg-white px-4 py-2 text-xs font-bold text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
                        >
                          Modifier mon portfolio
                        </button>
                      </div>
                    ) : !currentUser ? (
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          Connectez-vous pour envoyer une invitation à {selectedProfile.name} et démarrer une conversation après acceptation.
                        </p>
                        <button
                          type="button"
                          onClick={onOpenAuth}
                          className="rounded-xl bg-black dark:bg-white px-4 py-2 text-xs font-bold text-white dark:text-black"
                        >
                          Connexion / Inscription
                        </button>
                      </div>
                    ) : (
                      (() => {
                        const relation = getInviteRelation(selectedProfile.id);
                        if (relation?.status === 'accepted') {
                          return (
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                                <Check className="h-4 w-4" />
                                <span>Vous êtes connectés · Messagerie courte ouverte</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPeerId(selectedProfile.id);
                                  setActiveTab('messages');
                                }}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-black dark:bg-white px-4 py-2 text-xs font-bold text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200"
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
                                <span>Envoyer un message court</span>
                              </button>
                            </div>
                          );
                        }

                        if (relation?.status === 'pending') {
                          const iAmSender = relation.fromUserId === currentUser.id;
                          return iAmSender ? (
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="text-xs text-slate-600 dark:text-slate-300">
                                <span className="font-bold text-slate-900 dark:text-white">
                                  Invitation envoyée
                                </span>{' '}
                                — La discussion s'ouvrira dès que {selectedProfile.name} l'aura acceptée.
                              </div>
                              <button
                                type="button"
                                onClick={() => onRespondInvitation(relation.id, 'cancel')}
                                className="rounded-xl border border-slate-300 dark:border-zinc-700 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800"
                              >
                                Annuler l'invitation
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="text-xs text-slate-700 dark:text-slate-200">
                                <span className="font-bold">{selectedProfile.name}</span> vous a envoyé une invitation.
                                {relation.note && (
                                  <span className="block text-[11px] text-slate-500 italic mt-0.5">
                                    « {relation.note} »
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => onRespondInvitation(relation.id, 'declined')}
                                  className="rounded-xl border border-slate-300 dark:border-zinc-700 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800"
                                >
                                  Refuser
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const ok = await onRespondInvitation(relation.id, 'accepted');
                                    if (ok) {
                                      setSelectedPeerId(selectedProfile.id);
                                      setActiveTab('messages');
                                    }
                                  }}
                                  className="rounded-xl bg-black dark:bg-white px-3.5 py-1.5 text-xs font-bold text-white dark:text-black"
                                >
                                  Accepter &amp; discuter
                                </button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-2.5">
                            <div className="text-xs font-bold text-slate-900 dark:text-white">
                              Inviter {selectedProfile.name} pour échanger en texte court
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                type="text"
                                maxLength={200}
                                value={inviteNote}
                                onChange={(e) => setInviteNote(e.target.value)}
                                placeholder="Mot bref d'invitation (optionnel, max 200 car.)..."
                                className="flex-1 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-black dark:focus:border-white focus:outline-none"
                              />
                              <button
                                type="button"
                                disabled={isSendingInvite}
                                onClick={() => handleSendInviteSubmit(selectedProfile.id)}
                                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-black dark:bg-white px-4 py-2 text-xs font-bold text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50 shrink-0"
                              >
                                <Send className="h-3.5 w-3.5" />
                                <span>{isSendingInvite ? 'Envoi...' : 'Envoyer une invitation'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })()
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Search & Availability Filter */}
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher un développeur, pays, compétence..."
                        className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-black dark:focus:border-white focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                      {AVAILABILITY_FILTERS.map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setAvailabilityFilter(f)}
                          className={`rounded-xl border px-3 py-2 text-[11px] font-bold whitespace-nowrap transition-colors ${
                            availabilityFilter === f
                              ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                              : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Directory Grid */}
                  {filteredProfiles.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 dark:border-zinc-700 p-10 text-center space-y-2">
                      <Users className="mx-auto h-8 w-8 text-slate-400" />
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Aucun portfolio trouvé pour cette recherche.
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Complétez votre propre portfolio ou élargissez les filtres.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {filteredProfiles.map((prof) => {
                        const relation = getInviteRelation(prof.id);
                        const isMe = currentUser?.id === prof.id;
                        return (
                          <div
                            key={prof.id}
                            onClick={() => setSelectedProfileId(prof.id)}
                            className="cursor-pointer rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 space-y-3 hover:border-black dark:hover:border-white transition-all flex flex-col justify-between"
                          >
                            <div className="space-y-2.5">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black dark:bg-white text-white dark:text-black text-sm font-black">
                                    {prof.name.slice(0, 1).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
                                      {prof.name} {isMe && <span className="text-[10px] font-medium">(Vous)</span>}
                                    </h3>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                      {prof.role} · {prof.country}
                                    </p>
                                  </div>
                                </div>

                                <span className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 px-2 py-0.5 text-[10px] font-bold text-slate-800 dark:text-slate-200 shrink-0">
                                  {prof.availability}
                                </span>
                              </div>

                              {prof.headline ? (
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                                  {prof.headline}
                                </p>
                              ) : null}

                              {prof.bio ? (
                                <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                  {prof.bio}
                                </p>
                              ) : (
                                <p className="text-[11px] text-slate-400 dark:text-zinc-500 italic">
                                  Membre actif sur tomorrow · {prof.country}
                                </p>
                              )}

                              {prof.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {prof.skills.slice(0, 4).map((s) => (
                                    <span
                                      key={s}
                                      className="rounded-md bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-slate-800 dark:text-slate-200"
                                    >
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-[11px]">
                              <span className="text-slate-500 dark:text-slate-400 font-medium">
                                {prof.portfolioItems.length} projet{prof.portfolioItems.length > 1 ? 's' : ''}
                              </span>

                              {relation?.status === 'accepted' ? (
                                <span className="inline-flex items-center gap-1 font-bold text-black dark:text-white">
                                  <Check className="h-3 w-3" />
                                  <span>Connectés</span>
                                </span>
                              ) : relation?.status === 'pending' ? (
                                <span className="font-bold text-slate-500 dark:text-slate-400">
                                  Invitation en attente
                                </span>
                              ) : (
                                <span className="font-bold text-slate-900 dark:text-white">
                                  Consulter le portfolio →
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* TAB 2: INVITATIONS */}
          {activeTab === 'invites' && (
            <>
              {!currentUser ? (
                <div className="py-12 text-center space-y-3">
                  <Lock className="mx-auto h-8 w-8 text-slate-400" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Connectez-vous pour gérer vos invitations
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    Envoyez et acceptez des invitations pour débloquer les échanges en texte court entre membres.
                  </p>
                  <button
                    type="button"
                    onClick={onOpenAuth}
                    className="rounded-xl bg-black dark:bg-white px-4 py-2 text-xs font-bold text-white dark:text-black"
                  >
                    Se connecter / S'inscrire
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Received */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Invitations reçues ({receivedInvites.length})
                    </h3>
                    {receivedInvites.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 dark:border-zinc-700 p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                        Aucune invitation reçue pour le moment.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {receivedInvites.map((inv) => (
                          <div
                            key={inv.id}
                            className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedProfileId(inv.fromUserId);
                                    setActiveTab('profiles');
                                  }}
                                  className="text-sm font-black text-slate-900 dark:text-white hover:underline"
                                >
                                  {inv.fromUserName}
                                </button>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                  {inv.fromUserRole} · {inv.fromUserCountry}
                                </span>
                              </div>
                              {inv.note && (
                                <p className="text-xs text-slate-700 dark:text-slate-300 italic">
                                  « {inv.note} »
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {inv.status === 'pending' ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => onRespondInvitation(inv.id, 'declined')}
                                    className="rounded-xl border border-slate-300 dark:border-zinc-700 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800"
                                  >
                                    Refuser
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const ok = await onRespondInvitation(inv.id, 'accepted');
                                      if (ok) {
                                        setSelectedPeerId(inv.fromUserId);
                                        setActiveTab('messages');
                                      }
                                    }}
                                    className="rounded-xl bg-black dark:bg-white px-3.5 py-1.5 text-xs font-bold text-white dark:text-black"
                                  >
                                    Accepter
                                  </button>
                                </>
                              ) : inv.status === 'accepted' ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedPeerId(inv.fromUserId);
                                    setActiveTab('messages');
                                  }}
                                  className="inline-flex items-center gap-1 rounded-xl border border-black dark:border-white px-3 py-1.5 text-xs font-bold text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                                >
                                  <MessageSquare className="h-3.5 w-3.5" />
                                  <span>Discuter</span>
                                </button>
                              ) : (
                                <span className="text-[11px] font-semibold text-slate-400">
                                  Refusée
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sent */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Invitations envoyées ({sentInvites.length})
                    </h3>
                    {sentInvites.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 dark:border-zinc-700 p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                        Parcourez l'onglet Portfolios pour inviter un développeur ou membre.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {sentInvites.map((inv) => (
                          <div
                            key={inv.id}
                            className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedProfileId(inv.toUserId);
                                    setActiveTab('profiles');
                                  }}
                                  className="text-sm font-black text-slate-900 dark:text-white hover:underline"
                                >
                                  {inv.toUserName}
                                </button>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                  {inv.toUserRole} · {inv.toUserCountry}
                                </span>
                              </div>
                              {inv.note && (
                                <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                                  « {inv.note} »
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {inv.status === 'pending' ? (
                                <>
                                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                    En attente
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => onRespondInvitation(inv.id, 'cancel')}
                                    className="rounded-xl border border-slate-300 dark:border-zinc-700 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800"
                                  >
                                    Annuler
                                  </button>
                                </>
                              ) : inv.status === 'accepted' ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedPeerId(inv.toUserId);
                                    setActiveTab('messages');
                                  }}
                                  className="inline-flex items-center gap-1 rounded-xl bg-black dark:bg-white px-3 py-1.5 text-xs font-bold text-white dark:text-black"
                                >
                                  <MessageSquare className="h-3.5 w-3.5" />
                                  <span>Message court</span>
                                </button>
                              ) : (
                                <span className="text-[11px] font-semibold text-slate-400">
                                  Refusée
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 3: ACCEPTED SHORT TEXT MESSAGES */}
          {activeTab === 'messages' && (
            <>
              {!currentUser ? (
                <div className="py-12 text-center space-y-3">
                  <Lock className="mx-auto h-8 w-8 text-slate-400" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Messagerie réservée aux membres connectés
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    Connectez-vous pour accéder à vos conversations actives après acceptation d'invitation.
                  </p>
                  <button
                    type="button"
                    onClick={onOpenAuth}
                    className="rounded-xl bg-black dark:bg-white px-4 py-2 text-xs font-bold text-white dark:text-black"
                  >
                    Se connecter / S'inscrire
                  </button>
                </div>
              ) : acceptedPeers.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <MessageSquare className="mx-auto h-8 w-8 text-slate-400" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Aucune conversation ouverte pour l'instant
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    Pour échanger en message texte court, consultez un profil dans l'onglet Portfolios et envoyez une invitation. La conversation démarre dès son acceptation.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('profiles')}
                    className="rounded-xl bg-black dark:bg-white px-4 py-2 text-xs font-bold text-white dark:text-black"
                  >
                    Explorer les portfolios
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[380px]">
                  {/* Peers List */}
                  <div className="space-y-1.5 border-b md:border-b-0 md:border-r border-slate-200 dark:border-zinc-800 pb-3 md:pb-0 md:pr-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 pb-1">
                      Connexions acceptées ({acceptedPeers.length})
                    </div>
                    {acceptedPeers.map((peer) => {
                      const active = peer.id === selectedPeerId;
                      return (
                        <button
                          key={peer.id}
                          type="button"
                          onClick={() => setSelectedPeerId(peer.id)}
                          className={`w-full flex items-center gap-2.5 rounded-2xl p-2.5 text-left transition-colors ${
                            active
                              ? 'bg-black dark:bg-white text-white dark:text-black'
                              : 'bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'
                          }`}
                        >
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
                              active
                                ? 'bg-white dark:bg-black text-black dark:text-white'
                                : 'bg-black dark:bg-white text-white dark:text-black'
                            }`}
                          >
                            {peer.name.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold truncate">{peer.name}</div>
                            <div
                              className={`text-[10px] truncate ${
                                active ? 'text-slate-300 dark:text-zinc-600' : 'text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {peer.role} · {peer.country}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Chat Thread */}
                  <div className="md:col-span-2 flex flex-col rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 overflow-hidden min-h-[340px] max-h-[55vh]">
                    {selectedPeer ? (
                      <>
                        <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2.5">
                          <div className="min-w-0">
                            <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                              {selectedPeer.name}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                              {selectedPeer.role} · {selectedPeer.country}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProfileId(selectedPeer.id);
                              setActiveTab('profiles');
                            }}
                            className="rounded-lg border border-slate-200 dark:border-zinc-700 px-2.5 py-1 text-[10px] font-bold text-slate-800 dark:text-slate-200 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors shrink-0"
                          >
                            Voir portfolio
                          </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
                          {activeThreadMessages.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-center text-xs text-slate-400 dark:text-zinc-500 py-10">
                              Invitation acceptée ! Écrivez un premier message texte court ci-dessous.
                            </div>
                          ) : (
                            activeThreadMessages.map((msg) => {
                              const isMine = msg.senderId === currentUser.id;
                              return (
                                <div
                                  key={msg.id}
                                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                                >
                                  <div
                                    className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                                      isMine
                                        ? 'bg-black dark:bg-white text-white dark:text-black rounded-br-sm'
                                        : 'bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white rounded-bl-sm'
                                    }`}
                                  >
                                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                                    <div
                                      className={`mt-1 text-[9px] text-right ${
                                        isMine
                                          ? 'text-slate-300 dark:text-zinc-600'
                                          : 'text-slate-400 dark:text-zinc-400'
                                      }`}
                                    >
                                      {formatShortTime(msg.createdAt)}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                          <div ref={chatEndRef} />
                        </div>

                        <form
                          onSubmit={handleSendChatSubmit}
                          className="border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 space-y-1.5"
                        >
                          <div className="flex items-end gap-2">
                            <textarea
                              rows={2}
                              maxLength={500}
                              value={chatText}
                              onChange={(e) => setChatText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSendChatSubmit();
                                }
                              }}
                              placeholder="Message texte court (max 500 caractères)..."
                              className="flex-1 rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-black dark:focus:border-white focus:outline-none resize-none"
                            />
                            <button
                              type="submit"
                              disabled={isSendingChat || !chatText.trim()}
                              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-40 transition-colors"
                              aria-label="Envoyer le message"
                            >
                              <Send className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-400 px-1">
                            <span>Entrée pour envoyer · Maj+Entrée pour nouvelle ligne</span>
                            <span className="font-mono">{chatText.length}/500</span>
                          </div>
                        </form>
                      </>
                    ) : null}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
