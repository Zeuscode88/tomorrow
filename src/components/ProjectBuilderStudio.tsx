import React, { useState, useMemo } from 'react';
import {
  X,
  Globe,
  Code2,
  GitBranch,
  Users,
  Plus,
  Upload,
  Check,
  Copy,
  ExternalLink,
  Layers,
  Cpu,
  Plug,
  Trash2,
  Eye,
  EyeOff,
  Download,
  RefreshCw,
  Image as ImageIcon,
  Play,
  ShieldCheck,
  ArrowUpRight,
  ArrowLeft,
} from 'lucide-react';
import { AppIdea } from '../types/app';
import type { User } from '../types/auth';
import {
  ProjectBuild,
  ProgressStage,
  ExternalAgentConfig,
  ExternalAgentProvider,
  AgentPipelineRole,
  McpServerConfig,
  AgentExecutionLog,
} from '../types/builder';
import { WebViewFrame } from './WebViewFrame';
import { compressImageFile, isSafeHttpUrl, isSafeImageSrc } from '../utils/urlSafety';
import { getProjectShareUrl } from '../utils/projectExport';
import { syncBuildToFirestore } from '../services/builderSync';
import { AdinkraMotifIcon } from '../utils/africanIcons';

interface ProjectBuilderStudioProps {
  isOpen: boolean;
  onClose: () => void;
  app: AppIdea | null;
  builds: ProjectBuild[];
  onBuildsUpdated: (updatedBuild: ProjectBuild) => void;
  onOpenPublicRender: (build: ProjectBuild) => void;
  currentUser: User | null;
  authToken: string | null;
  onOpenAuth: () => void;
  onShowToast: (msg: string) => void;
  initialTab?: 'renders' | 'import' | 'ai' | 'agents';
}

const PROVIDER_DEFAULT_MODELS: Record<ExternalAgentProvider, string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-sonnet-latest',
  mistral: 'mistral-large-latest',
  groq: 'llama-3.3-70b-versatile',
  openrouter: 'anthropic/claude-3.5-sonnet',
  custom_openai: 'gpt-4o-mini',
};

export const ProjectBuilderStudio: React.FC<ProjectBuilderStudioProps> = ({
  isOpen,
  onClose,
  app,
  builds,
  onBuildsUpdated,
  onOpenPublicRender,
  currentUser,
  authToken,
  onOpenAuth,
  onShowToast,
  initialTab = 'renders',
}) => {
  const [activeTab, setActiveTab] = useState<'renders' | 'import' | 'ai' | 'agents'>(initialTab);
  const [selectedBuildId, setSelectedBuildId] = useState<string>('');
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [copiedRenderId, setCopiedRenderId] = useState<string | null>(null);

  // Join squad state
  const [joinRole, setJoinRole] = useState('Développeur Frontend');
  const [isJoining, setIsJoining] = useState(false);

  // Import / Version form state
  const [importTargetMode, setImportTargetMode] = useState<'new_build' | 'new_version'>('new_build');
  const [targetExistingBuildId, setTargetExistingBuildId] = useState<string>('');
  const [buildTitle, setBuildTitle] = useState('');
  const [buildSummary, setBuildSummary] = useState('');
  const [isGroupProject, setIsGroupProject] = useState(true);
  const [memberRole, setMemberRole] = useState('Lead Développeur');
  const [progressStage, setProgressStage] = useState<ProgressStage>('Prototype');
  const [progressPercent, setProgressPercent] = useState<number>(40);
  const [versionTag, setVersionTag] = useState('v0.1.0');
  const [changelog, setChangelog] = useState('');
  const [sourceMode, setSourceMode] = useState<'external_url' | 'html_bundle'>('external_url');
  const [previewUrl, setPreviewUrl] = useState('');
  const [htmlBundle, setHtmlBundle] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [screenshotUrlInput, setScreenshotUrlInput] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  // Internal AI Studio state
  const [aiInstructions, setAiInstructions] = useState('');
  const [generatedHtml, setGeneratedHtml] = useState('');
  const [generatedSummary, setGeneratedSummary] = useState('');
  const [useInternalAi, setUseInternalAi] = useState(true);
  const [useConnectedAgentsAndMcp, setUseConnectedAgentsAndMcp] = useState(true);
  const [isGeneratingApp, setIsGeneratingApp] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<AgentExecutionLog[]>([]);
  const [lastAgentsUsed, setLastAgentsUsed] = useState<string[]>([]);
  const [lastMcpToolsUsed, setLastMcpToolsUsed] = useState<string[]>([]);
  const [showCodeInspector, setShowCodeInspector] = useState(false);
  const [aiBuildTitle, setAiBuildTitle] = useState('');
  const [aiVersionTag, setAiVersionTag] = useState('v0.1.0-ai');
  const [isPublishingAi, setIsPublishingAi] = useState(false);

  // BYO External AI Agents & MCP Servers (strictly in React memory, never saved to Firestore/disk)
  const [externalAgents, setExternalAgents] = useState<ExternalAgentConfig[]>([]);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentProvider, setNewAgentProvider] = useState<ExternalAgentProvider>('openai');
  const [newAgentRole, setNewAgentRole] = useState<AgentPipelineRole>('Architecte');
  const [newAgentModel, setNewAgentModel] = useState(PROVIDER_DEFAULT_MODELS.openai);
  const [newAgentEndpoint, setNewAgentEndpoint] = useState('');
  const [newAgentToken, setNewAgentToken] = useState('');
  const [showNewAgentToken, setShowNewAgentToken] = useState(false);

  const [mcpServers, setMcpServers] = useState<McpServerConfig[]>([]);
  const [newMcpName, setNewMcpName] = useState('');
  const [newMcpUrl, setNewMcpUrl] = useState('');
  const [newMcpToken, setNewMcpToken] = useState('');
  const [isInspectingMcpId, setIsInspectingMcpId] = useState<string | null>(null);

  const projectBuilds = useMemo(() => {
    if (!app) return [];
    return builds.filter((b) => b.appId === app.id);
  }, [builds, app]);

  const activeBuild = useMemo(() => {
    if (projectBuilds.length === 0) return null;
    return projectBuilds.find((b) => b.id === selectedBuildId) || projectBuilds[0];
  }, [projectBuilds, selectedBuildId]);

  const activeVersion = useMemo(() => {
    if (!activeBuild) return null;
    return (
      activeBuild.versions.find((v) => v.id === selectedVersionId) ||
      activeBuild.versions.find((v) => v.id === activeBuild.activeVersionId) ||
      activeBuild.versions[0] ||
      null
    );
  }, [activeBuild, selectedVersionId]);

  if (!isOpen || !app) return null;

  const ensureAuth = (): boolean => {
    if (!currentUser || !authToken) {
      onShowToast('Connectez-vous ou inscrivez-vous pour publier, rejoindre un groupe ou lancer l\'IA.');
      onOpenAuth();
      return false;
    }
    return true;
  };

  const handleCopyPublicRenderLink = async (build: ProjectBuild) => {
    const link = getProjectShareUrl(app, build.id);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedRenderId(build.id);
      setTimeout(() => setCopiedRenderId(null), 1800);
      onShowToast('Lien public du rendu copié ! Visible par tous sans inscription.');
    } catch {
      onShowToast('Impossible de copier le lien.');
    }
  };

  const handleJoinSquad = async (buildId: string) => {
    if (!ensureAuth()) return;
    setIsJoining(true);
    try {
      const res = await fetch(`/api/builds/${encodeURIComponent(buildId)}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ role: joinRole }),
      });
      const data = await res.json();
      if (data.success && data.build) {
        await syncBuildToFirestore(data.build);
        onBuildsUpdated(data.build);
        onShowToast(
          data.alreadyMember
            ? 'Vous faites déjà partie de cette équipe.'
            : 'Vous avez rejoint le groupe de développement !'
        );
      } else {
        onShowToast(data.error || 'Impossible de rejoindre le groupe.');
      }
    } catch {
      onShowToast('Erreur réseau lors de l\'adhésion au groupe.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleSwitchActiveVersion = async (buildId: string, verId: string) => {
    if (!ensureAuth()) return;
    try {
      const res = await fetch(`/api/builds/${encodeURIComponent(buildId)}/active-version`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ versionId: verId }),
      });
      const data = await res.json();
      if (data.success && data.build) {
        await syncBuildToFirestore(data.build);
        onBuildsUpdated(data.build);
        onShowToast('Version active mise à jour pour le lien public !');
      } else {
        onShowToast(data.error || 'Action réservée aux membres du build.');
      }
    } catch {
      onShowToast('Erreur lors du changement de version active.');
    }
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 4 - screenshots.length);
    for (const file of files) {
      try {
        const compressed = await compressImageFile(file);
        setScreenshots((prev) => [...prev.slice(0, 5), compressed]);
      } catch (err: any) {
        onShowToast(err?.message || 'Image ignorée.');
      }
    }
    e.target.value = '';
  };

  const handleAddScreenshotUrl = () => {
    if (!isSafeHttpUrl(screenshotUrlInput)) {
      onShowToast('Entrez une URL d\'image https:// valide.');
      return;
    }
    setScreenshots((prev) => [...prev.slice(0, 5), screenshotUrlInput.trim()]);
    setScreenshotUrlInput('');
  };

  const handleHtmlFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setHtmlBundle(String(reader.result || '').slice(0, 240_000));
      setSourceMode('html_bundle');
      onShowToast(`Fichier ${file.name} importé dans l'éditeur WebView.`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handlePublishImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ensureAuth()) return;

    setIsPublishing(true);
    try {
      if (importTargetMode === 'new_build' || projectBuilds.length === 0) {
        const res = await fetch('/api/builds', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            appId: app.id,
            title: buildTitle.trim() || `${app.title} — Prototype`,
            summary: buildSummary.trim(),
            progressStage,
            progressPercent,
            isGroupProject,
            memberRole,
            githubUrl: githubUrl.trim(),
            versionTag: versionTag.trim() || 'v0.1.0',
            changelog: changelog.trim() || 'Version initiale publiée',
            mode: sourceMode,
            previewUrl: sourceMode === 'external_url' ? previewUrl.trim() : '',
            htmlCode: sourceMode === 'html_bundle' ? htmlBundle : '',
            screenshots,
          }),
        });
        const data = await res.json();
        if (data.success && data.build) {
          await syncBuildToFirestore(data.build);
          onBuildsUpdated(data.build);
          setSelectedBuildId(data.build.id);
          setSelectedVersionId(data.build.activeVersionId);
          setActiveTab('renders');
          onShowToast('Projet importé ! Votre rendu WebView et votre lien public sont en ligne.');
        } else {
          onShowToast(data.error || 'Erreur lors de la publication.');
        }
      } else {
        const bId = targetExistingBuildId || activeBuild?.id;
        if (!bId) {
          onShowToast('Sélectionnez un projet existant.');
          return;
        }
        const res = await fetch(`/api/builds/${encodeURIComponent(bId)}/versions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            versionTag: versionTag.trim() || undefined,
            changelog: changelog.trim() || 'Nouvelle version publiée',
            mode: sourceMode,
            previewUrl: sourceMode === 'external_url' ? previewUrl.trim() : '',
            htmlCode: sourceMode === 'html_bundle' ? htmlBundle : '',
            githubUrl: githubUrl.trim(),
            screenshots,
            progressStage,
            progressPercent,
            summary: buildSummary.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (data.success && data.build) {
          await syncBuildToFirestore(data.build);
          onBuildsUpdated(data.build);
          setSelectedBuildId(data.build.id);
          setSelectedVersionId(data.build.activeVersionId);
          setActiveTab('renders');
          onShowToast(`Version ${data.version?.versionTag} publiée avec succès !`);
        } else {
          onShowToast(data.error || 'Impossible de publier cette version.');
        }
      }
    } catch {
      onShowToast('Erreur réseau lors de la publication.');
    } finally {
      setIsPublishing(false);
    }
  };

  // Internal AI + Multi-Agent + MCP Generation
  const handleRunInternalAiBuilder = async () => {
    if (!ensureAuth()) return;
    setIsGeneratingApp(true);
    setExecutionLogs([]);
    try {
      const res = await fetch('/api/builder/ai-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          appId: app.id,
          instructions: aiInstructions.trim(),
          currentHtml: generatedHtml || '',
          useInternalAi,
          externalAgents: useConnectedAgentsAndMcp ? externalAgents.filter((a) => a.enabled && a.token) : [],
          mcpServers: useConnectedAgentsAndMcp
            ? mcpServers
                .filter((m) => m.status === 'connected' || isSafeHttpUrl(m.url))
                .map((m) => ({
                  name: m.name,
                  url: m.url,
                  bearerToken: m.bearerToken,
                  selectedToolNames: m.selectedToolNames,
                }))
            : [],
        }),
      });
      const data = await res.json();
      if (Array.isArray(data.executionLogs)) {
        setExecutionLogs(data.executionLogs);
      }
      if (data.success && data.htmlCode) {
        setGeneratedHtml(data.htmlCode);
        setGeneratedSummary(data.summary || `Prototype IA généré pour ${app.title}`);
        setLastAgentsUsed(data.agentsUsed || ['tomorrow IA']);
        setLastMcpToolsUsed(data.mcpToolsUsed || []);
        if (!aiBuildTitle) {
          setAiBuildTitle(`${app.title} — Studio IA`);
        }
        onShowToast('Application générée en interne ! Prévisualisez et publiez pour obtenir un lien public.');
      } else {
        onShowToast(data.error || 'La génération IA a rencontré une erreur.');
      }
    } catch {
      onShowToast('Erreur réseau pendant la génération IA.');
    } finally {
      setIsGeneratingApp(false);
    }
  };

  const handlePublishAiBuild = async () => {
    if (!ensureAuth() || !generatedHtml) return;
    setIsPublishingAi(true);
    try {
      const existingMemberBuild = projectBuilds.find(
        (b) => b.ownerId === currentUser?.id || b.members.some((m) => m.userId === currentUser?.id)
      );

      if (existingMemberBuild) {
        const nextTag = `v0.${existingMemberBuild.versions.length + 1}.0-ai`;
        const res = await fetch(`/api/builds/${encodeURIComponent(existingMemberBuild.id)}/versions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            versionTag: aiVersionTag.trim() || nextTag,
            changelog: generatedSummary || 'Version générée par l\'IA interne tomorrow',
            mode: 'internal_ai',
            htmlCode: generatedHtml,
            progressStage: 'Prototype',
            progressPercent: Math.max(existingMemberBuild.progressPercent, 55),
            aiEngineLabel: lastAgentsUsed.join(' + ') || 'tomorrow IA',
            mcpToolsUsed: lastMcpToolsUsed,
          }),
        });
        const data = await res.json();
        if (data.success && data.build) {
          await syncBuildToFirestore(data.build);
          onBuildsUpdated(data.build);
          setSelectedBuildId(data.build.id);
          setSelectedVersionId(data.build.activeVersionId);
          setActiveTab('renders');
          onShowToast('Nouvelle version IA publiée avec lien de rendu public !');
        } else {
          onShowToast(data.error || 'Erreur lors de la publication IA.');
        }
      } else {
        const res = await fetch('/api/builds', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            appId: app.id,
            title: aiBuildTitle.trim() || `${app.title} — Build IA`,
            summary: generatedSummary || `Prototype généré en interne pour ${app.title}`,
            progressStage: 'Prototype',
            progressPercent: 50,
            isGroupProject: true,
            versionTag: aiVersionTag.trim() || 'v0.1.0-ai',
            changelog: generatedSummary || 'Prototype initial généré par IA interne',
            mode: 'internal_ai',
            htmlCode: generatedHtml,
            aiEngineLabel: lastAgentsUsed.join(' + ') || 'tomorrow IA',
            mcpToolsUsed: lastMcpToolsUsed,
          }),
        });
        const data = await res.json();
        if (data.success && data.build) {
          await syncBuildToFirestore(data.build);
          onBuildsUpdated(data.build);
          setSelectedBuildId(data.build.id);
          setSelectedVersionId(data.build.activeVersionId);
          setActiveTab('renders');
          onShowToast('Rendu IA publié ! Le lien public est prêt à être partagé.');
        } else {
          onShowToast(data.error || 'Erreur lors de la publication IA.');
        }
      }
    } catch {
      onShowToast('Erreur réseau lors de la publication.');
    } finally {
      setIsPublishingAi(false);
    }
  };

  const handleDownloadGeneratedHtml = () => {
    if (!generatedHtml) return;
    const blob = new Blob([generatedHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${app.title.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}-tomorrow.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // External Agent Management
  const handleAddExternalAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName.trim() || !newAgentToken.trim()) {
      onShowToast('Nom de l\'agent et token API requis.');
      return;
    }
    if (newAgentProvider === 'custom_openai' && !isSafeHttpUrl(newAgentEndpoint)) {
      onShowToast('URL HTTPS valide requise pour un endpoint personnalisé.');
      return;
    }
    const created: ExternalAgentConfig = {
      id: `agent-${Date.now()}`,
      name: newAgentName.trim(),
      provider: newAgentProvider,
      role: newAgentRole,
      model: newAgentModel.trim() || PROVIDER_DEFAULT_MODELS[newAgentProvider],
      endpointUrl: newAgentProvider === 'custom_openai' ? newAgentEndpoint.trim() : undefined,
      token: newAgentToken.trim(),
      enabled: true,
    };
    setExternalAgents((prev) => [...prev, created]);
    setNewAgentName('');
    setNewAgentToken('');
    setNewAgentEndpoint('');
    onShowToast(`Agent "${created.name}" connecté en mémoire de session.`);
  };

  // MCP Server Management
  const handleAddAndInspectMcp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ensureAuth()) return;
    if (!newMcpName.trim() || !isSafeHttpUrl(newMcpUrl)) {
      onShowToast('Nom et URL HTTPS du serveur MCP requis.');
      return;
    }

    const mcpId = `mcp-${Date.now()}`;
    const entry: McpServerConfig = {
      id: mcpId,
      name: newMcpName.trim(),
      url: newMcpUrl.trim(),
      bearerToken: newMcpToken.trim() || undefined,
      status: 'connecting',
      tools: [],
      resources: [],
      selectedToolNames: [],
    };
    setMcpServers((prev) => [...prev, entry]);
    setNewMcpName('');
    setNewMcpUrl('');
    setNewMcpToken('');
    await inspectExistingMcp(entry);
  };

  const inspectExistingMcp = async (server: McpServerConfig) => {
    if (!ensureAuth()) return;
    setIsInspectingMcpId(server.id);
    setMcpServers((prev) =>
      prev.map((m) => (m.id === server.id ? { ...m, status: 'connecting', errorMessage: undefined } : m))
    );
    try {
      const res = await fetch('/api/mcp/inspect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ url: server.url, bearerToken: server.bearerToken }),
      });
      const data = await res.json();
      if (data.success) {
        const discoveredTools = Array.isArray(data.tools) ? data.tools : [];
        const discoveredResources = Array.isArray(data.resources) ? data.resources : [];
        setMcpServers((prev) =>
          prev.map((m) =>
            m.id === server.id
              ? {
                  ...m,
                  status: 'connected',
                  tools: discoveredTools,
                  resources: discoveredResources,
                  selectedToolNames: discoveredTools.slice(0, 2).map((t: any) => t.name),
                }
              : m
          )
        );
        onShowToast(`MCP "${server.name}" connecté (${discoveredTools.length} outil(s)).`);
      } else {
        setMcpServers((prev) =>
          prev.map((m) =>
            m.id === server.id ? { ...m, status: 'error', errorMessage: data.error } : m
          )
        );
        onShowToast(data.error || 'Échec de connexion au serveur MCP.');
      }
    } catch {
      setMcpServers((prev) =>
        prev.map((m) =>
          m.id === server.id ? { ...m, status: 'error', errorMessage: 'Erreur réseau' } : m
        )
      );
    } finally {
      setIsInspectingMcpId(null);
    }
  };

  const toggleMcpToolSelection = (mcpId: string, toolName: string) => {
    setMcpServers((prev) =>
      prev.map((m) => {
        if (m.id !== mcpId) return m;
        const exists = m.selectedToolNames.includes(toolName);
        return {
          ...m,
          selectedToolNames: exists
            ? m.selectedToolNames.filter((t) => t !== toolName)
            : [...m.selectedToolNames, toolName],
        };
      })
    );
  };

  const isCurrentUserMemberOfActiveBuild = Boolean(
    currentUser &&
      activeBuild &&
      (activeBuild.ownerId === currentUser.id ||
        activeBuild.members.some((m) => m.userId === currentUser.id))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs p-2 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-6xl rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden my-4 flex flex-col max-h-[92vh]">
        {/* Studio Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 sm:px-5 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors shrink-0"
              aria-label="Retour"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Retour</span>
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-black text-black dark:text-white lowercase">tomorrow</span>
                <span aria-hidden="true">/</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">{app.title}</span>
                <span aria-hidden="true">·</span>
                <span className="hidden sm:inline">{app.country}</span>
              </div>
              <h2 className="text-base sm:text-xl font-black tracking-tight text-slate-900 dark:text-white truncate">
                Atelier Collaborative Build, WebView & Studio IA
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0"
            aria-label="Fermer l'atelier"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Studio Navigation Tabs */}
        <div className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/60 px-3 sm:px-5 py-2 grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('renders')}
            className={`inline-flex items-center justify-center sm:justify-start gap-1 rounded-xl px-2.5 py-1.5 text-[10.5px] sm:text-[11px] font-bold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'renders'
                ? 'bg-black dark:bg-white text-white dark:text-black'
                : 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Globe className="h-3 w-3 shrink-0" />
            <span className="truncate">Rendus & Équipes ({projectBuilds.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`inline-flex items-center justify-center sm:justify-start gap-1 rounded-xl px-2.5 py-1.5 text-[10.5px] sm:text-[11px] font-bold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'import'
                ? 'bg-black dark:bg-white text-white dark:text-black'
                : 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Upload className="h-3 w-3 shrink-0" />
            <span className="truncate">Importer / Versionner</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`inline-flex items-center justify-center sm:justify-start gap-1 rounded-xl px-2.5 py-1.5 text-[10.5px] sm:text-[11px] font-bold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'ai'
                ? 'bg-black dark:bg-white text-white dark:text-black'
                : 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <AdinkraMotifIcon className="h-3 w-3 shrink-0" />
            <span className="truncate">Studio IA Interne</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('agents')}
            className={`inline-flex items-center justify-center sm:justify-start gap-1 rounded-xl px-2.5 py-1.5 text-[10.5px] sm:text-[11px] font-bold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'agents'
                ? 'bg-black dark:bg-white text-white dark:text-black'
                : 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Plug className="h-3 w-3 shrink-0" />
            <span className="truncate">
              Agents & MCP ({externalAgents.filter((a) => a.enabled).length + mcpServers.filter((m) => m.status === 'connected').length})
            </span>
          </button>
        </div>

        {/* Scrollable Studio Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* ================= TAB 1: RENDUS & ÉQUIPES ================= */}
          {activeTab === 'renders' && (
            <div className="space-y-6">
              {projectBuilds.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950/60 p-8 sm:p-10 text-center space-y-4">
                  <Code2 className="h-10 w-10 text-slate-400 dark:text-slate-500 mx-auto" />
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Aucun prototype ou rendu publié pour ce projet
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
                      Importez votre propre application via un lien WebView / GitHub pour présenter votre avancement en solo ou en groupe, ou confiez la création initiale à notre Studio IA interne.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab('import')}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-zinc-700"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Importer mon projet</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('ai')}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-black dark:bg-white px-4 py-2.5 text-xs font-bold text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200"
                    >
                      <AdinkraMotifIcon className="h-4 w-4" />
                      <span>Créer par l'IA en interne</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left column: Builds & Squads selector */}
                  <div className="lg:col-span-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Builds & Équipes ({projectBuilds.length})
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          setImportTargetMode('new_build');
                          setActiveTab('import');
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-black dark:text-white hover:underline"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Nouveau build</span>
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {projectBuilds.map((b) => {
                        const isSelected = activeBuild?.id === b.id;
                        const activeVer =
                          b.versions.find((v) => v.id === b.activeVersionId) || b.versions[0];
                        return (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => {
                              setSelectedBuildId(b.id);
                              setSelectedVersionId(b.activeVersionId);
                            }}
                            className={`w-full text-left rounded-2xl border p-4 transition-all ${
                              isSelected
                                ? 'border-black dark:border-white bg-slate-50 dark:bg-zinc-800 shadow-xs'
                                : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-slate-400 dark:hover:border-zinc-600'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                                {b.title}
                              </span>
                              <span className="font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-300 tabular-nums shrink-0">
                                {activeVer?.versionTag || 'v0.1.0'}
                              </span>
                            </div>

                            <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                              <span>{b.progressStage}</span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums">{b.progressPercent}%</span>
                              <span aria-hidden="true">·</span>
                              <span>
                                {b.isGroupProject ? `Groupe (${b.members.length})` : 'Solo'}
                              </span>
                            </div>

                            {/* Progress bar */}
                            <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-200 dark:bg-zinc-700 overflow-hidden">
                              <div
                                className="h-full bg-black dark:bg-white rounded-full transition-all"
                                style={{ width: `${b.progressPercent}%` }}
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right column: Active Build WebView, Versions, Public Link & Team */}
                  {activeBuild && (
                    <div className="lg:col-span-8 space-y-5">
                      {/* Action Header for selected build */}
                      <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="text-base font-black text-slate-900 dark:text-white">
                              {activeBuild.title}
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                              {activeBuild.summary || 'Prototype collaboratif'}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleCopyPublicRenderLink(activeBuild)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-zinc-700 whitespace-nowrap"
                            >
                              {copiedRenderId === activeBuild.id ? (
                                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                              <span>
                                {copiedRenderId === activeBuild.id
                                  ? 'Lien public copié'
                                  : 'Copier lien public'}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onOpenPublicRender(activeBuild)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-black dark:bg-white px-3.5 py-2 text-xs font-bold text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 whitespace-nowrap"
                            >
                              <ArrowUpRight className="h-3.5 w-3.5" />
                              <span>Visiter le rendu public</span>
                            </button>
                          </div>
                        </div>

                        {/* Version Switcher & GitHub */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-zinc-800 pt-3 text-xs">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                              <Layers className="h-3.5 w-3.5" />
                              Version :
                            </span>
                            <select
                              value={activeVersion?.id || ''}
                              onChange={(e) => setSelectedVersionId(e.target.value)}
                              className="rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1 font-mono text-xs font-semibold text-slate-800 dark:text-slate-100"
                            >
                              {activeBuild.versions.map((v) => (
                                <option key={v.id} value={v.id}>
                                  {v.versionTag} — {new Date(v.createdAt).toLocaleDateString('fr-FR')}
                                  {v.id === activeBuild.activeVersionId ? ' (Active)' : ''}
                                </option>
                              ))}
                            </select>

                            {isCurrentUserMemberOfActiveBuild &&
                              activeVersion &&
                              activeVersion.id !== activeBuild.activeVersionId && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSwitchActiveVersion(activeBuild.id, activeVersion.id)
                                  }
                                  className="rounded-lg bg-slate-900 dark:bg-white px-2.5 py-1 text-[11px] font-bold text-white dark:text-black hover:bg-black dark:hover:bg-slate-200"
                                >
                                  Définir comme active
                                </button>
                              )}

                            {isCurrentUserMemberOfActiveBuild && (
                              <button
                                type="button"
                                onClick={() => {
                                  setImportTargetMode('new_version');
                                  setTargetExistingBuildId(activeBuild.id);
                                  setVersionTag(`v0.${activeBuild.versions.length + 1}.0`);
                                  setGithubUrl(activeBuild.githubUrl || '');
                                  setProgressStage(activeBuild.progressStage);
                                  setProgressPercent(activeBuild.progressPercent);
                                  setActiveTab('import');
                                }}
                                className="rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1 text-[11px] font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-zinc-700"
                              >
                                + Publier v0.{activeBuild.versions.length + 1}.0
                              </button>
                            )}
                          </div>

                          {(activeVersion?.githubUrl || activeBuild.githubUrl) &&
                            isSafeHttpUrl(activeVersion?.githubUrl || activeBuild.githubUrl) && (
                              <a
                                href={activeVersion?.githubUrl || activeBuild.githubUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 hover:underline"
                              >
                                <GitBranch className="h-3.5 w-3.5" />
                                <span>Voir sur GitHub</span>
                                <ExternalLink className="h-3 w-3 text-slate-400" />
                              </a>
                            )}
                        </div>
                      </div>

                      {/* Embedded WebView */}
                      {activeVersion && (
                        <WebViewFrame
                          mode={activeVersion.mode}
                          previewUrl={activeVersion.previewUrl}
                          htmlCode={activeVersion.htmlCode}
                          title={activeBuild.title}
                          heightClass="h-[430px]"
                        />
                      )}

                      {/* Changelog + Screenshots + Squad Collaboration */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            Journal de version ({activeVersion?.versionTag})
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {activeVersion?.changelog}
                          </p>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500">
                            Auteur : {activeVersion?.authorName}
                            {activeVersion?.aiEngineLabel
                              ? ` · Moteur : ${activeVersion.aiEngineLabel}`
                              : ''}
                          </div>

                          {activeVersion?.screenshots &&
                            activeVersion.screenshots.filter(isSafeImageSrc).length > 0 && (
                              <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 space-y-2">
                                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                  <ImageIcon className="h-3.5 w-3.5" />
                                  <span>Captures d'écran</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  {activeVersion.screenshots
                                    .filter(isSafeImageSrc)
                                    .map((img, i) => (
                                      <img
                                        key={i}
                                        src={img}
                                        alt={`Capture ${i + 1}`}
                                        referrerPolicy="no-referrer"
                                        className="h-24 w-full object-cover rounded-lg border border-slate-200 dark:border-zinc-700"
                                      />
                                    ))}
                                </div>
                              </div>
                            )}
                        </div>

                        {/* Group / Squad Collaboration */}
                        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <Users className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                              <span>
                                {activeBuild.isGroupProject ? 'Groupe collaboratif' : 'Équipe Solo'} (
                                {activeBuild.members.length})
                              </span>
                            </h4>
                          </div>

                          <div className="divide-y divide-slate-100 dark:divide-zinc-800 max-h-40 overflow-y-auto">
                            {activeBuild.members.map((m) => (
                              <div
                                key={m.userId}
                                className="py-1.5 flex items-center justify-between text-xs"
                              >
                                <div>
                                  <span className="font-semibold text-slate-900 dark:text-white">{m.name}</span>
                                  <span className="text-slate-400 mx-1.5">·</span>
                                  <span className="text-slate-600 dark:text-slate-300">{m.role}</span>
                                </div>
                                <span className="text-[11px] text-slate-400 dark:text-slate-500">{m.country}</span>
                              </div>
                            ))}
                          </div>

                          {activeBuild.isGroupProject && !isCurrentUserMemberOfActiveBuild && (
                            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 space-y-2">
                              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                                Rejoindre ce petit groupe pour coder ensemble :
                              </label>
                              <div className="flex flex-wrap sm:flex-nowrap gap-2">
                                <select
                                  value={joinRole}
                                  onChange={(e) => setJoinRole(e.target.value)}
                                  className="flex-1 min-w-0 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                                >
                                  <option value="Développeur Frontend">Développeur Frontend</option>
                                  <option value="Développeur Backend">Développeur Backend</option>
                                  <option value="Mobile / USSD">Mobile / USSD</option>
                                  <option value="Designer UI/UX">Designer UI/UX</option>
                                  <option value="Ingénieur IA & MCP">Ingénieur IA & MCP</option>
                                </select>
                                <button
                                  type="button"
                                  disabled={isJoining}
                                  onClick={() => handleJoinSquad(activeBuild.id)}
                                  className="rounded-xl bg-black dark:bg-white px-3 py-1.5 text-xs font-bold text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50 whitespace-nowrap"
                                >
                                  {isJoining ? 'Adhésion...' : 'Rejoindre'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 2: IMPORTER / VERSIONNER ================= */}
          {activeTab === 'import' && (
            <form onSubmit={handlePublishImport} className="max-w-3xl mx-auto space-y-5">
              <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/60 p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Importer un projet externe ou publier une nouvelle version
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Connectez un client externe dans la WebView, joignez votre dépôt GitHub, vos captures d'écran et gérez vos versions en solo ou en groupe.
                  </p>
                </div>

                {projectBuilds.length > 0 && (
                  <div className="flex rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setImportTargetMode('new_build')}
                      className={`rounded-lg px-3 py-1.5 font-semibold transition-colors ${
                        importTargetMode === 'new_build'
                          ? 'bg-black dark:bg-white text-white dark:text-black'
                          : 'text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      Nouveau build
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImportTargetMode('new_version');
                        const target = activeBuild || projectBuilds[0];
                        if (target) {
                          setTargetExistingBuildId(target.id);
                          setVersionTag(`v0.${target.versions.length + 1}.0`);
                        }
                      }}
                      className={`rounded-lg px-3 py-1.5 font-semibold transition-colors ${
                        importTargetMode === 'new_version'
                          ? 'bg-black dark:bg-white text-white dark:text-black'
                          : 'text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      Nouvelle version
                    </button>
                  </div>
                )}
              </div>

              {importTargetMode === 'new_version' && projectBuilds.length > 0 ? (
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Build cible à mettre à jour *
                  </label>
                  <select
                    value={targetExistingBuildId || activeBuild?.id || ''}
                    onChange={(e) => setTargetExistingBuildId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    {projectBuilds.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title} ({b.versions.length} version(s) · par {b.ownerName})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Nom du build ou de l'équipe *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={`Ex: ${app.title} — Équipe Dakar`}
                      value={buildTitle}
                      onChange={(e) => setBuildTitle(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-black dark:focus:border-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Mode de collaboration
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setIsGroupProject(true)}
                        className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                          isGroupProject
                            ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                            : 'border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        Petit groupe ouvert
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsGroupProject(false)}
                        className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                          !isGroupProject
                            ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                            : 'border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        Projet Solo
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Description de l'avancement
                </label>
                <textarea
                  rows={2}
                  placeholder="Décrivez ce qui fonctionne déjà, l'architecture choisie et les prochaines étapes..."
                  value={buildSummary}
                  onChange={(e) => setBuildSummary(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-black dark:focus:border-white focus:outline-none"
                />
              </div>

              {/* Source Type: External URL WebView OR HTML Bundle */}
              <div className="space-y-3 rounded-2xl border border-slate-200 dark:border-zinc-800 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Source du rendu WebView
                  </span>
                  <div className="flex rounded-lg bg-slate-100 dark:bg-zinc-800 p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setSourceMode('external_url')}
                      className={`rounded-md px-3 py-1 font-semibold ${
                        sourceMode === 'external_url'
                          ? 'bg-white dark:bg-zinc-900 text-black dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Client externe (URL)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSourceMode('html_bundle')}
                      className={`rounded-md px-3 py-1 font-semibold ${
                        sourceMode === 'html_bundle'
                          ? 'bg-white dark:bg-zinc-900 text-black dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Importer HTML / App
                    </button>
                  </div>
                </div>

                {sourceMode === 'external_url' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      URL du client externe à ouvrir dans la WebView
                    </label>
                    <input
                      type="url"
                      placeholder="https://mon-prototype.vercel.app"
                      value={previewUrl}
                      onChange={(e) => setPreviewUrl(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2 text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-black dark:focus:border-white focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Code HTML autonome ou fichier .html
                      </label>
                      <label className="cursor-pointer inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1 text-[11px] font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-700">
                        <Upload className="h-3 w-3" />
                        <span>Importer un fichier .html</span>
                        <input
                          type="file"
                          accept=".html,.htm"
                          onChange={handleHtmlFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <textarea
                      rows={5}
                      placeholder="<!DOCTYPE html><html>...</html>"
                      value={htmlBundle}
                      onChange={(e) => setHtmlBundle(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 p-3 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-black dark:focus:border-white focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Lien du dépôt GitHub (optionnel)
                  </label>
                  <input
                    type="url"
                    placeholder="https://github.com/equipe/mon-projet"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2 text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-black dark:focus:border-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Version, Stage, Progress */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Numéro de version
                  </label>
                  <input
                    type="text"
                    placeholder="v0.1.0"
                    value={versionTag}
                    onChange={(e) => setVersionTag(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Stade d'avancement
                  </label>
                  <select
                    value={progressStage}
                    onChange={(e) => setProgressStage(e.target.value as ProgressStage)}
                    className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Concept">Concept</option>
                    <option value="Prototype">Prototype</option>
                    <option value="Alpha">Alpha</option>
                    <option value="Beta">Beta</option>
                    <option value="Production">Production</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Progression ({progressPercent}%)
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={progressPercent}
                    onChange={(e) => setProgressPercent(Number(e.target.value))}
                    className="w-full accent-black dark:accent-white mt-2"
                  />
                </div>
              </div>

              {importTargetMode === 'new_build' && (
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Votre rôle dans le projet
                  </label>
                  <input
                    type="text"
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Notes de version (Changelog)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Intégration du module hors-ligne et du paiement Mobile Money"
                  value={changelog}
                  onChange={(e) => setChangelog(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>

              {/* Screenshots upload / URLs */}
              <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Captures d'écran / Images ({screenshots.length}/6)
                  </span>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-700">
                    <ImageIcon className="h-3.5 w-3.5" />
                    <span>Ajouter des images</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleScreenshotUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap gap-2">
                  <input
                    type="url"
                    placeholder="Ou coller l'URL d'une capture https://..."
                    value={screenshotUrlInput}
                    onChange={(e) => setScreenshotUrlInput(e.target.value)}
                    className="flex-1 min-w-0 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddScreenshotUrl}
                    className="rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-700"
                  >
                    Ajouter
                  </button>
                </div>

                {screenshots.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {screenshots.map((src, i) => (
                      <div key={i} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-700">
                        <img src={src} alt={`Aperçu ${i + 1}`} className="h-24 w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setScreenshots((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-1.5 right-1.5 rounded-full bg-black/75 p-1 text-white opacity-90 hover:bg-black"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  disabled={isPublishing}
                  className="inline-flex items-center gap-2 rounded-xl bg-black dark:bg-white px-5 py-2.5 text-xs font-bold text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  <span>
                    {isPublishing
                      ? 'Publication...'
                      : importTargetMode === 'new_version'
                      ? 'Publier cette version & Mettre à jour le lien'
                      : 'Publier le projet & Générer le lien public'}
                  </span>
                </button>
              </div>
            </form>
          )}

          {/* ================= TAB 3: STUDIO IA INTERNE ================= */}
          {activeTab === 'ai' && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/60 p-4 sm:p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <AdinkraMotifIcon className="h-4 w-4 text-black dark:text-white" />
                      <span>Création interne par Intelligence Artificielle (sans sortir de tomorrow)</span>
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Confiez ce projet africain à notre IA intégrée et/ou à vos agents IA & serveurs MCP connectés pour générer une application web interactive complète dans la WebView.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('agents')}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-zinc-700 whitespace-nowrap"
                  >
                    <Plug className="h-3.5 w-3.5" />
                    <span>Configurer Agents & MCP</span>
                  </button>
                </div>

                {/* Prompt & Options */}
                <div className="space-y-3">
                  <textarea
                    rows={3}
                    placeholder={`Instructions pour l'IA (ex: "Crée un tableau de bord terrain complet pour ${app.title} à ${app.country} avec mode hors-ligne, formulaire de saisie et simulation Mobile Money...")`}
                    value={aiInstructions}
                    onChange={(e) => setAiInstructions(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-black dark:focus:border-white focus:outline-none"
                  />

                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Ajouter simulation Mobile Money (Wave / Orange / M-Pesa)',
                      'Mode hors-ligne 2G avec synchronisation locale',
                      'Tableau de bord coopérative & statistiques terrain',
                      'Interface bilingue Français / Anglais',
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() =>
                          setAiInstructions((prev) => (prev ? `${prev}\n- ${preset}` : preset))
                        }
                        className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-zinc-500 hover:text-black dark:hover:text-white"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700 dark:text-slate-300">
                      <label className="inline-flex items-center gap-2 cursor-pointer font-semibold">
                        <input
                          type="checkbox"
                          checked={useInternalAi}
                          onChange={(e) => setUseInternalAi(e.target.checked)}
                          className="rounded border-slate-300 dark:border-zinc-700 accent-black dark:accent-white"
                        />
                        <span>Moteur interne tomorrow IA</span>
                      </label>

                      <label className="inline-flex items-center gap-2 cursor-pointer font-semibold">
                        <input
                          type="checkbox"
                          checked={useConnectedAgentsAndMcp}
                          onChange={(e) => setUseConnectedAgentsAndMcp(e.target.checked)}
                          className="rounded border-slate-300 dark:border-zinc-700 accent-black dark:accent-white"
                        />
                        <span>
                          Agents externes ({externalAgents.filter((a) => a.enabled).length}) & MCP (
                          {mcpServers.filter((m) => m.status === 'connected').length})
                        </span>
                      </label>
                    </div>

                    <button
                      type="button"
                      disabled={isGeneratingApp}
                      onClick={handleRunInternalAiBuilder}
                      className="inline-flex items-center gap-2 rounded-xl bg-black dark:bg-white px-5 py-2.5 text-xs font-bold text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50"
                    >
                      {isGeneratingApp ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      <span>
                        {isGeneratingApp
                          ? 'Orchestration & Build en cours...'
                          : generatedHtml
                          ? 'Itérer / Améliorer le rendu'
                          : 'Construire l\'application par IA'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Execution Pipeline Logs */}
              {executionLogs.length > 0 && (
                <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Journal d'orchestration IA & MCP
                  </h4>
                  <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {executionLogs.map((log, i) => (
                      <div key={i} className="py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 dark:text-slate-100">{log.actor}</span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-600 dark:text-slate-300">{log.step}</span>
                        </div>
                        <span
                          className={`text-[11px] font-medium ${
                            log.status === 'ok'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : log.status === 'warn'
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-rose-700 dark:text-rose-400'
                          }`}
                        >
                          {log.detail}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Generated Result + Live WebView + Publish Action */}
              {generatedHtml && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1 max-w-xl">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        Aperçu généré ({lastAgentsUsed.join(' + ')})
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">{generatedSummary}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowCodeInspector((v) => !v)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-zinc-700"
                      >
                        <Code2 className="h-3.5 w-3.5" />
                        <span>{showCodeInspector ? 'Masquer code' : 'Voir code HTML'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadGeneratedHtml}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-zinc-700"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Exporter .html</span>
                      </button>
                    </div>
                  </div>

                  {showCodeInspector && (
                    <textarea
                      rows={10}
                      value={generatedHtml}
                      onChange={(e) => setGeneratedHtml(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 dark:border-zinc-700 bg-slate-950 text-slate-100 p-4 font-mono text-xs focus:outline-none"
                    />
                  )}

                  <WebViewFrame
                    mode="internal_ai"
                    htmlCode={generatedHtml}
                    title={app.title}
                    heightClass="h-[500px]"
                  />

                  {/* Publish as permanent public version */}
                  <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/60 p-4 flex flex-wrap items-end gap-3 justify-between">
                    <div className="flex flex-wrap gap-3 flex-1">
                      <div className="min-w-[200px] flex-1">
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Titre du rendu public
                        </label>
                        <input
                          type="text"
                          value={aiBuildTitle}
                          onChange={(e) => setAiBuildTitle(e.target.value)}
                          placeholder={`${app.title} — Studio IA`}
                          className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="w-32">
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Tag version
                        </label>
                        <input
                          type="text"
                          value={aiVersionTag}
                          onChange={(e) => setAiVersionTag(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isPublishingAi}
                      onClick={handlePublishAiBuild}
                      className="inline-flex items-center gap-2 rounded-xl bg-black dark:bg-white px-5 py-2.5 text-xs font-bold text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50"
                    >
                      <Globe className="h-4 w-4" />
                      <span>
                        {isPublishingAi
                          ? 'Publication...'
                          : 'Publier & Générer le lien visible par tous'}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 4: AGENTS IA EXTERNES & MCP ================= */}
          {activeTab === 'agents' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/30 p-4 flex items-start gap-3 text-xs text-emerald-900 dark:text-emerald-200">
                <ShieldCheck className="h-5 w-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">
                    Confidentialité des tokens : Mémoire de session uniquement
                  </div>
                  <p className="text-emerald-800 dark:text-emerald-300/90 mt-0.5">
                    Les jetons de vos agents IA personnels et serveurs MCP restent exclusivement dans la mémoire vive de votre navigateur pendant votre session. Ils ne sont jamais enregistrés dans Firestore ni sur disque.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: External AI Agents with BYO Token */}
                <section className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                      <span>Connecter vos propres Agents IA</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Associez plusieurs agents spécialisés (Architecte, Développeur, UI/UX, Sécurité) avec votre propre token.
                    </p>
                  </div>

                  <form onSubmit={handleAddExternalAgent} className="space-y-3 border-b border-slate-100 dark:border-zinc-800 pb-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        required
                        placeholder="Nom (ex: Mon Agent Claude)"
                        value={newAgentName}
                        onChange={(e) => setNewAgentName(e.target.value)}
                        className="rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
                      />
                      <select
                        value={newAgentRole}
                        onChange={(e) => setNewAgentRole(e.target.value as AgentPipelineRole)}
                        className="rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                      >
                        <option value="Architecte">Rôle : Architecte</option>
                        <option value="Développeur Full-Stack">Rôle : Développeur Full-Stack</option>
                        <option value="Designer UI/UX">Rôle : Designer UI/UX</option>
                        <option value="Réviseur Sécurité">Rôle : Réviseur Sécurité</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <select
                        value={newAgentProvider}
                        onChange={(e) => {
                          const prov = e.target.value as ExternalAgentProvider;
                          setNewAgentProvider(prov);
                          setNewAgentModel(PROVIDER_DEFAULT_MODELS[prov]);
                        }}
                        className="rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                      >
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic (Claude)</option>
                        <option value="mistral">Mistral AI</option>
                        <option value="groq">Groq</option>
                        <option value="openrouter">OpenRouter</option>
                        <option value="custom_openai">Endpoint OpenAI-compatible</option>
                      </select>

                      <input
                        type="text"
                        placeholder="Modèle (ex: gpt-4o-mini)"
                        value={newAgentModel}
                        onChange={(e) => setNewAgentModel(e.target.value)}
                        className="rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400"
                      />
                    </div>

                    {newAgentProvider === 'custom_openai' && (
                      <input
                        type="url"
                        required
                        placeholder="https://mon-agent.exemple.com/v1/chat/completions"
                        value={newAgentEndpoint}
                        onChange={(e) => setNewAgentEndpoint(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400"
                      />
                    )}

                    <div className="relative">
                      <input
                        type={showNewAgentToken ? 'text' : 'password'}
                        required
                        placeholder="Token personnel de l'agent (session uniquement)"
                        value={newAgentToken}
                        onChange={(e) => setNewAgentToken(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-9 py-2 text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewAgentToken((s) => !s)}
                        className="absolute inset-y-0 right-0 px-3 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      >
                        {showNewAgentToken ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>

                    <button
                      type="submit"
                      className="w-full rounded-xl bg-black dark:bg-white py-2 text-xs font-bold text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200"
                    >
                      + Connecter cet agent au pipeline
                    </button>
                  </form>

                  {/* Connected Agents List */}
                  <div className="space-y-2">
                    {externalAgents.length === 0 ? (
                      <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">
                        Aucun agent externe configuré. Le moteur interne tomorrow IA est prêt par défaut.
                      </p>
                    ) : (
                      externalAgents.map((agent) => (
                        <div
                          key={agent.id}
                          className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/60 p-3 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {agent.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {agent.role} · {agent.provider} ({agent.model})
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                setExternalAgents((prev) =>
                                  prev.map((a) =>
                                    a.id === agent.id ? { ...a, enabled: !a.enabled } : a
                                  )
                                )
                              }
                              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                                agent.enabled
                                  ? 'bg-black dark:bg-white text-white dark:text-black'
                                  : 'bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {agent.enabled ? 'Actif' : 'Pausé'}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setExternalAgents((prev) => prev.filter((a) => a.id !== agent.id))
                              }
                              className="p-1.5 text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                {/* Right: MCP (Model Context Protocol) Servers */}
                <section className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Plug className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                      <span>Connecter un ou plusieurs serveurs MCP</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Connectez vos serveurs Model Context Protocol (HTTP / JSON-RPC HTTPS) pour injecter vos outils et ressources contextuelles dans le Studio IA.
                    </p>
                  </div>

                  <form onSubmit={handleAddAndInspectMcp} className="space-y-3 border-b border-slate-100 dark:border-zinc-800 pb-4">
                    <input
                      type="text"
                      required
                      placeholder="Nom du serveur MCP (ex: GitHub MCP, Docs MCP)"
                      value={newMcpName}
                      onChange={(e) => setNewMcpName(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
                    />
                    <input
                      type="url"
                      required
                      placeholder="https://mon-serveur-mcp.exemple.com/mcp"
                      value={newMcpUrl}
                      onChange={(e) => setNewMcpUrl(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400"
                    />
                    <input
                      type="password"
                      placeholder="Bearer Token MCP (optionnel, session uniquement)"
                      value={newMcpToken}
                      onChange={(e) => setNewMcpToken(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400"
                    />
                    <button
                      type="submit"
                      className="w-full rounded-xl bg-black dark:bg-white py-2 text-xs font-bold text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200"
                    >
                      + Connecter & Découvrir les outils MCP
                    </button>
                  </form>

                  {/* Connected MCP Servers List */}
                  <div className="space-y-3">
                    {mcpServers.length === 0 ? (
                      <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">
                        Aucun serveur MCP connecté pour l'instant.
                      </p>
                    ) : (
                      mcpServers.map((mcp) => (
                        <div
                          key={mcp.id}
                          className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/60 p-3 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 dark:text-white">{mcp.name}</div>
                              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                                {mcp.url}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                disabled={isInspectingMcpId === mcp.id}
                                onClick={() => inspectExistingMcp(mcp)}
                                className="rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-700"
                              >
                                {isInspectingMcpId === mcp.id ? 'Sync...' : 'Rafraîchir'}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setMcpServers((prev) => prev.filter((m) => m.id !== mcp.id))
                                }
                                className="p-1 text-slate-400 hover:text-rose-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="text-[11px] font-semibold">
                            {mcp.status === 'connected' && (
                              <span className="text-emerald-700 dark:text-emerald-400">
                                Connecté · {mcp.tools.length} outil(s) · {mcp.resources.length} ressource(s)
                              </span>
                            )}
                            {mcp.status === 'connecting' && (
                              <span className="text-slate-600 dark:text-slate-300">Découverte JSON-RPC en cours...</span>
                            )}
                            {mcp.status === 'error' && (
                              <span className="text-rose-700 dark:text-rose-400">{mcp.errorMessage}</span>
                            )}
                          </div>

                          {mcp.tools.length > 0 && (
                            <div className="pt-1.5 border-t border-slate-200/70 dark:border-zinc-800 space-y-1">
                              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                Outils MCP actifs pour la génération :
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {mcp.tools.map((t) => {
                                  const selected = mcp.selectedToolNames.includes(t.name);
                                  return (
                                    <button
                                      key={t.name}
                                      type="button"
                                      onClick={() => toggleMcpToolSelection(mcp.id, t.name)}
                                      title={t.description || t.name}
                                      className={`rounded-lg px-2 py-1 text-[11px] font-mono transition-colors ${
                                        selected
                                          ? 'bg-black dark:bg-white text-white dark:text-black'
                                          : 'bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-slate-200 hover:border-black dark:hover:border-white'
                                      }`}
                                    >
                                      {t.name}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
