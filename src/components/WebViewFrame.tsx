import React, { useState } from 'react';
import {
  Monitor,
  Tablet,
  Smartphone,
  RefreshCw,
  ExternalLink,
  Code2,
  Globe,
} from 'lucide-react';
import { isSafeHttpUrl } from '../utils/urlSafety';

interface WebViewFrameProps {
  mode: 'external_url' | 'internal_ai' | 'html_bundle';
  previewUrl?: string;
  htmlCode?: string;
  title: string;
  heightClass?: string;
}

export const WebViewFrame: React.FC<WebViewFrameProps> = ({
  mode,
  previewUrl,
  htmlCode,
  title,
  heightClass = 'h-[480px]',
}) => {
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [reloadKey, setReloadKey] = useState(0);

  const safeExternalUrl = previewUrl && isSafeHttpUrl(previewUrl) ? previewUrl : null;
  const hasHtml = Boolean(htmlCode && htmlCode.trim().length > 0);
  const useHtmlMode = (mode === 'internal_ai' || mode === 'html_bundle') && hasHtml;

  const widthClass =
    viewport === 'mobile'
      ? 'max-w-[390px]'
      : viewport === 'tablet'
      ? 'max-w-[768px]'
      : 'w-full';

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-950 overflow-hidden">
      {/* WebView Browser Chrome */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-2.5">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-200">
            {useHtmlMode ? <Code2 className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
          </span>
          <div className="min-w-0 flex-1 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 px-2.5 py-1 text-[11px] font-mono text-slate-600 dark:text-slate-300 truncate">
            {useHtmlMode
              ? `webview://tomorrow-sandbox/${title.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}`
              : safeExternalUrl || 'Aucune URL de rendu configurée'}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center rounded-lg bg-slate-100 dark:bg-zinc-800 p-0.5 border border-slate-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => setViewport('desktop')}
              title="Vue Bureau"
              className={`rounded-md p-1.5 transition-colors ${
                viewport === 'desktop'
                  ? 'bg-white dark:bg-zinc-950 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewport('tablet')}
              title="Vue Tablette"
              className={`rounded-md p-1.5 transition-colors ${
                viewport === 'tablet'
                  ? 'bg-white dark:bg-zinc-950 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Tablet className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewport('mobile')}
              title="Vue Mobile"
              className={`rounded-md p-1.5 transition-colors ${
                viewport === 'mobile'
                  ? 'bg-white dark:bg-zinc-950 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            title="Recharger la WebView"
            className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>

          {safeExternalUrl && (
            <a
              href={safeExternalUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Ouvrir le client externe dans un nouvel onglet"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-black dark:hover:text-white transition-colors whitespace-nowrap"
            >
              <ExternalLink className="h-3 w-3" />
              <span className="hidden sm:inline">Ouvrir</span>
            </a>
          )}
        </div>
      </div>

      {/* Viewport Container */}
      <div className="p-2.5 sm:p-4 flex justify-center bg-slate-100 dark:bg-zinc-950">
        {useHtmlMode ? (
          <iframe
            key={`html-${reloadKey}`}
            title={`WebView - ${title}`}
            srcDoc={htmlCode}
            sandbox="allow-scripts allow-forms"
            className={`${widthClass} ${heightClass} rounded-xl border border-slate-200 dark:border-zinc-800 bg-white shadow-sm transition-all duration-200`}
          />
        ) : safeExternalUrl ? (
          <div className={`${widthClass} w-full space-y-2`}>
            <iframe
              key={`url-${reloadKey}-${safeExternalUrl}`}
              title={`WebView - ${title}`}
              src={safeExternalUrl}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              referrerPolicy="no-referrer"
              className={`w-full ${heightClass} rounded-xl border border-slate-200 dark:border-zinc-800 bg-white shadow-sm transition-all duration-200`}
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
              Si l'application externe bloque l'affichage intégré (X-Frame-Options), utilisez le bouton « Ouvrir » ci-dessus.
            </p>
          </div>
        ) : (
          <div className={`w-full ${heightClass} rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex flex-col items-center justify-center p-6 text-center`}>
            <Globe className="h-8 w-8 text-slate-300 dark:text-zinc-600 mb-2" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Aucun aperçu WebView sur cette version</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
              Consultez les captures d'écran ou le dépôt GitHub associé ci-dessous.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
