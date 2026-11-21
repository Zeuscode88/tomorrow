import React, { useState } from 'react';
import {
  FileDown,
  FileText,
  Copy,
  Check,
  MessageCircle,
  Send,
  Share2,
  Link2,
} from 'lucide-react';
import { AppIdea } from '../types/app';
import { ProjectBuild } from '../types/builder';
import {
  exportProjectToPdf,
  downloadProjectText,
  buildProjectShareText,
  getProjectShareUrl,
  getWhatsAppShareUrl,
  getTelegramShareUrl,
  getMessengerShareUrl,
} from '../utils/projectExport';

interface ExportShareBarProps {
  app: AppIdea;
  builds?: ProjectBuild[];
  renderBuildId?: string;
  onShowToast?: (msg: string) => void;
  compact?: boolean;
}

export const ExportShareBar: React.FC<ExportShareBarProps> = ({
  app,
  builds = [],
  renderBuildId,
  onShowToast,
  compact = false,
}) => {
  const [copiedType, setCopiedType] = useState<'link' | 'text' | null>(null);

  const shareUrl = getProjectShareUrl(app, renderBuildId);
  const whatsappUrl = getWhatsAppShareUrl(app, renderBuildId);
  const telegramUrl = getTelegramShareUrl(app, renderBuildId);
  const messengerUrl = getMessengerShareUrl(app, renderBuildId);

  const handleExportPdf = () => {
    try {
      exportProjectToPdf(app, builds);
      onShowToast?.('Fiche complète exportée en PDF !');
    } catch (err) {
      console.error(err);
      onShowToast?.('Impossible de générer le PDF sur ce navigateur.');
    }
  };

  const handleDownloadText = () => {
    downloadProjectText(app, builds);
    onShowToast?.('Fiche texte téléchargée (.txt) !');
  };

  const handleCopyText = async () => {
    const text = buildProjectShareText(app, {
      includeLink: true,
      renderBuildId,
      compact: false,
      builds,
    });
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType('text');
      setTimeout(() => setCopiedType(null), 1800);
      onShowToast?.('Fiche complète copiée (prête à coller sur WhatsApp, Messenger, Telegram) !');
    } catch {
      onShowToast?.('Copie impossible sur ce navigateur.');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedType('link');
      setTimeout(() => setCopiedType(null), 1800);
      onShowToast?.('Lien copié dans le presse-papier !');
    } catch {
      onShowToast?.('Copie impossible sur ce navigateur.');
    }
  };

  const handleNativeShare = async () => {
    const compactText = buildProjectShareText(app, {
      includeLink: false,
      renderBuildId,
      compact: true,
    });
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${app.title} · tomorrow`,
          text: compactText,
          url: shareUrl,
        });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }
    await handleCopyText();
  };

  const handleMessengerClick = async () => {
    const text = buildProjectShareText(app, { includeLink: true, renderBuildId, compact: true });
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        onShowToast?.('Résumé copié ! Collez-le dans Messenger si la fenêtre ne pré-remplit pas le message.');
      }
    } catch {
      // ignore
    }
  };

  return (
    <div
      className={`rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-950/80 ${
        compact ? 'p-3' : 'p-4'
      } space-y-3`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
            Exporter & Partager la fiche complète
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Accessible librement à tous les visiteurs et membres inscrits
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportPdf}
            className="inline-flex items-center gap-1.5 rounded-xl bg-black dark:bg-white px-3.5 py-2 text-xs font-semibold text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0"
          >
            <FileDown className="h-3.5 w-3.5" />
            <span>Exporter PDF</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadText}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Télécharger .txt</span>
          </button>

          <button
            type="button"
            onClick={handleCopyText}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0"
          >
            {copiedType === 'text' ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            <span>{copiedType === 'text' ? 'Fiche copiée' : 'Copier texte'}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-200/80 dark:border-zinc-800 pt-2.5">
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1">Partager via :</span>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors whitespace-nowrap shrink-0"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          <span>WhatsApp</span>
        </a>

        <a
          href={telegramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 dark:border-sky-900 bg-sky-50 dark:bg-sky-950/50 px-3 py-1.5 text-xs font-semibold text-sky-800 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors whitespace-nowrap shrink-0"
        >
          <Send className="h-3.5 w-3.5" />
          <span>Telegram</span>
        </a>

        <a
          href={messengerUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleMessengerClick}
          className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1.5 text-xs font-semibold text-indigo-800 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors whitespace-nowrap shrink-0"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          <span>Messenger</span>
        </a>

        <button
          type="button"
          onClick={handleNativeShare}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0"
        >
          <Share2 className="h-3.5 w-3.5" />
          <span>Autre app</span>
        </button>

        <button
          type="button"
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0 sm:ml-auto"
        >
          {copiedType === 'link' ? (
            <Check className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <Link2 className="h-3.5 w-3.5" />
          )}
          <span>{copiedType === 'link' ? 'Lien copié' : 'Copier le lien'}</span>
        </button>
      </div>
    </div>
  );
};
