import { parse } from 'node-html-parser';
import { downloadAndCacheImage } from './ogpImageCache';

export interface OgData {
  title?: string;
  description?: string;
  image?: string;
  /** ローカルにキャッシュされた画像のパス */
  localImage?: string;
  favicon?: string;
}

const cache = new Map<string, OgData>();

function normaliseUrl(base: string, value?: string | null): string | undefined {
  if (!value) return undefined;
  try {
    return new URL(value, base).toString();
  } catch {
    return undefined;
  }
}

function pickMeta(root: ReturnType<typeof parse>, selectors: Array<[string, string]>): string | undefined {
  for (const [attribute, value] of selectors) {
    const node = root.querySelector(`meta[${attribute}="${value}"]`);
    const content = node?.getAttribute('content');
    if (content) return content.trim();
  }
  return undefined;
}

function pickLink(root: ReturnType<typeof parse>, relValues: string[]): string | undefined {
  for (const rel of relValues) {
    const link = root.querySelector(`link[rel="${rel}"]`);
    const href = link?.getAttribute('href');
    if (href) return href.trim();
  }
  return undefined;
}

export async function fetchOgData(url: string): Promise<OgData> {
  if (cache.has(url)) {
    return cache.get(url)!;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  let html = '';
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'AstroBlogBot/1.0 (+https://example.com)'
      }
    });
    html = await response.text();
  } catch (error) {
    console.warn(`[fetchOgData] Failed to fetch ${url}:`, error);
  } finally {
    clearTimeout(timeout);
  }

  if (!html) {
    const fallback: OgData = {};
    cache.set(url, fallback);
    return fallback;
  }

  const root = parse(html);

  const title =
    pickMeta(root, [
      ['property', 'og:title'],
      ['name', 'twitter:title']
    ]) ?? root.querySelector('title')?.text?.trim();

  const description = pickMeta(root, [
    ['property', 'og:description'],
    ['name', 'description'],
    ['name', 'twitter:description']
  ]);

  const imageRaw = pickMeta(root, [
    ['property', 'og:image'],
    ['name', 'twitter:image']
  ]);

  const faviconRaw = pickLink(root, ['icon', 'shortcut icon', 'apple-touch-icon']);

  const image = normaliseUrl(url, imageRaw);

  // OGP画像をローカルにキャッシュ
  let localImage: string | undefined;
  if (image) {
    const cachedPath = await downloadAndCacheImage(image);
    if (cachedPath) {
      localImage = cachedPath;
    }
  }

  const result: OgData = {
    title,
    description,
    image,
    localImage,
    favicon: normaliseUrl(url, faviconRaw)
  };

  cache.set(url, result);
  return result;
}
