import { getAfricanLanguageByCode } from '../data/africanLanguages';

const ORIGINAL_TEXT_MAP = new WeakMap<Text, string>();
const ORIGINAL_ATTR_MAP = new WeakMap<Element, Record<string, string>>();
const MEMORY_CACHE: Record<string, Record<string, string>> = {};

const TRANSLATABLE_ATTRS = ['placeholder', 'title', 'aria-label'] as const;
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'SVG', 'TEXTAREA']);

function getStorageKey(lang: string): string {
  return `tomorrow_tr_v1_${lang}`;
}

function loadLangCache(lang: string): Record<string, string> {
  if (MEMORY_CACHE[lang]) return MEMORY_CACHE[lang];
  try {
    const raw = localStorage.getItem(getStorageKey(lang));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        MEMORY_CACHE[lang] = parsed;
        return parsed;
      }
    }
  } catch {}
  MEMORY_CACHE[lang] = {};
  return MEMORY_CACHE[lang];
}

function saveLangCache(lang: string, cache: Record<string, string>) {
  MEMORY_CACHE[lang] = cache;
  try {
    localStorage.setItem(getStorageKey(lang), JSON.stringify(cache));
  } catch {}
}

function isSkippableString(str: string): boolean {
  const trimmed = str.trim();
  if (!trimmed || trimmed.length < 2) return true;
  // Pure numbers, punctuation, time counters, or URLs
  if (/^[\d\s.,:%+\-–—·/|°•()]+$/.test(trimmed)) return true;
  if (/^https?:\/\//i.test(trimmed)) return true;
  if (/^tomorrow(\.africa)?$/i.test(trimmed)) return true;
  if (/^jdeek studio$/i.test(trimmed)) return true;
  return false;
}

function shouldSkipElement(el: Element | null): boolean {
  let curr: Element | null = el;
  while (curr) {
    if (SKIP_TAGS.has(curr.tagName)) return true;
    if (curr.getAttribute('data-no-translate') === 'true') return true;
    curr = curr.parentElement;
  }
  return false;
}

function collectTargets(root: HTMLElement): {
  textNodes: { node: Text; orig: string; trimmed: string; lead: string; trail: string }[];
  attrNodes: { el: Element; attr: string; orig: string }[];
} {
  const textNodes: { node: Text; orig: string; trimmed: string; lead: string; trail: string }[] = [];
  const attrNodes: { el: Element; attr: string; orig: string }[] = [];

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let node = walker.nextNode();

  while (node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const textNode = node as Text;
      if (!shouldSkipElement(textNode.parentElement)) {
        let orig = ORIGINAL_TEXT_MAP.get(textNode);
        if (orig === undefined) {
          orig = textNode.nodeValue || '';
          if (!isSkippableString(orig)) {
            ORIGINAL_TEXT_MAP.set(textNode, orig);
          }
        }
        if (orig && !isSkippableString(orig)) {
          const match = orig.match(/^(\s*)([\s\S]*?)(\s*)$/);
          const lead = match?.[1] || '';
          const trimmed = match?.[2] || orig.trim();
          const trail = match?.[3] || '';
          if (!isSkippableString(trimmed)) {
            textNodes.push({ node: textNode, orig, trimmed, lead, trail });
          }
        }
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      if (!shouldSkipElement(el)) {
        let saved = ORIGINAL_ATTR_MAP.get(el);
        for (const attr of TRANSLATABLE_ATTRS) {
          const currentVal = el.getAttribute(attr);
          if (!currentVal || isSkippableString(currentVal)) continue;
          if (!saved) {
            saved = {};
            ORIGINAL_ATTR_MAP.set(el, saved);
          }
          if (saved[attr] === undefined) {
            saved[attr] = currentVal;
          }
          const origAttr = saved[attr];
          if (origAttr && !isSkippableString(origAttr)) {
            attrNodes.push({ el, attr, orig: origAttr.trim() });
          }
        }
      }
    }
    node = walker.nextNode();
  }

  return { textNodes, attrNodes };
}

export function restoreOriginalLanguage() {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = 'fr';
  document.documentElement.dir = 'ltr';

  const root = document.getElementById('root') || document.body;
  if (!root) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let node = walker.nextNode();
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const textNode = node as Text;
      const orig = ORIGINAL_TEXT_MAP.get(textNode);
      if (orig !== undefined && textNode.nodeValue !== orig) {
        textNode.nodeValue = orig;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const saved = ORIGINAL_ATTR_MAP.get(el);
      if (saved) {
        for (const [attr, origVal] of Object.entries(saved)) {
          if (el.getAttribute(attr) !== origVal) {
            el.setAttribute(attr, origVal);
          }
        }
      }
    }
    node = walker.nextNode();
  }
}

export async function applyGoogleTranslation(
  targetLang: string,
  options?: { signal?: AbortSignal }
): Promise<{ ok: boolean; error?: string }> {
  if (typeof document === 'undefined') return { ok: true };

  if (targetLang === 'fr') {
    restoreOriginalLanguage();
    return { ok: true };
  }

  const langMeta = getAfricanLanguageByCode(targetLang);
  document.documentElement.lang = langMeta.code;
  document.documentElement.dir = langMeta.dir || 'ltr';

  const root = document.getElementById('root') || document.body;
  if (!root) return { ok: true };

  const { textNodes, attrNodes } = collectTargets(root);
  const cache = loadLangCache(targetLang);

  // Apply whatever is already cached synchronously first (0ms perceived latency)
  const missingSet = new Set<string>();
  for (const item of textNodes) {
    const tr = cache[item.trimmed];
    if (tr) {
      const nextVal = `${item.lead}${tr}${item.trail}`;
      if (item.node.nodeValue !== nextVal) {
        item.node.nodeValue = nextVal;
      }
    } else {
      missingSet.add(item.trimmed);
    }
  }
  for (const item of attrNodes) {
    const tr = cache[item.orig];
    if (tr) {
      if (item.el.getAttribute(item.attr) !== tr) {
        item.el.setAttribute(item.attr, tr);
      }
    } else {
      missingSet.add(item.orig);
    }
  }

  const missing = Array.from(missingSet);
  if (missing.length === 0) {
    return { ok: true };
  }

  // Batch translate missing strings via Google Gemini endpoint (/api/gemini/translate)
  const chunkSize = 80;
  for (let i = 0; i < missing.length; i += chunkSize) {
    if (options?.signal?.aborted) return { ok: false };
    const chunk = missing.slice(i, i + chunkSize);

    try {
      const resp = await fetch('/api/gemini/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: options?.signal,
        body: JSON.stringify({
          targetLang: langMeta.code,
          targetLangName: `${langMeta.frenchName} (${langMeta.nativeName})`,
          texts: chunk,
        }),
      });

      const data = await resp.json();
      if (!resp.ok || !data.success || !data.translations) {
        return { ok: false, error: data.error || 'Traduction indisponible.' };
      }

      Object.assign(cache, data.translations);
      saveLangCache(targetLang, cache);

      // Apply freshly translated chunk immediately
      for (const item of textNodes) {
        const tr = cache[item.trimmed];
        if (tr) {
          const nextVal = `${item.lead}${tr}${item.trail}`;
          if (item.node.nodeValue !== nextVal) {
            item.node.nodeValue = nextVal;
          }
        }
      }
      for (const item of attrNodes) {
        const tr = cache[item.orig];
        if (tr && item.el.getAttribute(item.attr) !== tr) {
          item.el.setAttribute(item.attr, tr);
        }
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return { ok: false };
      return { ok: false, error: 'Mode hors-ligne : traduction en cache uniquement.' };
    }
  }

  return { ok: true };
}
