import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { OGP_CACHE_MAX_AGE_DAYS } from '../config/sites.config.js';

/** プロジェクトルートを取得 */
const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '../..');

/** 画像の保存先（公開ディレクトリ） */
const IMAGE_CACHE_DIR = join(PROJECT_ROOT, 'public/ogp-cache');
/** マニフェストの保存先（非公開） */
const MANIFEST_DIR = join(PROJECT_ROOT, '.cache');
const MANIFEST_PATH = join(MANIFEST_DIR, 'ogp-manifest.json');

interface CacheEntry {
  localPath: string;
  cachedAt: string;
}

interface CacheManifest {
  version: number;
  entries: Record<string, CacheEntry>;
}

/**
 * URLからキャッシュキー（ハッシュ）を生成
 */
export function generateCacheKey(url: string): string {
  return createHash('md5').update(url).digest('hex').slice(0, 16);
}

/**
 * マニフェストを読み込み
 */
export function loadManifest(): CacheManifest {
  if (!existsSync(MANIFEST_PATH)) {
    return { version: 1, entries: {} };
  }
  try {
    const content = readFileSync(MANIFEST_PATH, 'utf-8');
    return JSON.parse(content);
  } catch {
    return { version: 1, entries: {} };
  }
}

/**
 * マニフェストを保存
 */
export function saveManifest(manifest: CacheManifest): void {
  ensureManifestDir();
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

/**
 * マニフェストディレクトリを確保
 */
function ensureManifestDir(): void {
  if (!existsSync(MANIFEST_DIR)) {
    mkdirSync(MANIFEST_DIR, { recursive: true });
  }
}

/**
 * 画像キャッシュディレクトリを確保
 */
function ensureImageCacheDir(): void {
  if (!existsSync(IMAGE_CACHE_DIR)) {
    mkdirSync(IMAGE_CACHE_DIR, { recursive: true });
  }
}

/**
 * キャッシュが有効期限内かどうかを確認
 */
function isCacheValid(cachedAt: string): boolean {
  if (OGP_CACHE_MAX_AGE_DAYS <= 0) {
    // 0以下の場合は無期限
    return true;
  }
  const cachedDate = new Date(cachedAt);
  const now = new Date();
  const diffDays = (now.getTime() - cachedDate.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays < OGP_CACHE_MAX_AGE_DAYS;
}

/**
 * キャッシュ済み画像のローカルパスを取得
 * キャッシュが存在しない、または有効期限切れの場合はnullを返す
 */
export function getLocalImagePath(imageUrl: string): string | null {
  const manifest = loadManifest();
  const entry = manifest.entries[imageUrl];

  if (!entry) {
    return null;
  }

  // 有効期限チェック
  if (!isCacheValid(entry.cachedAt)) {
    return null;
  }

  // ファイルが実際に存在するか確認
  const fullPath = join(IMAGE_CACHE_DIR, entry.localPath.replace('/ogp-cache/', ''));
  if (!existsSync(fullPath)) {
    return null;
  }

  return entry.localPath;
}

/**
 * 画像をダウンロードしてキャッシュ
 * 成功時はローカルパスを返し、失敗時はnullを返す
 */
export async function downloadAndCacheImage(imageUrl: string): Promise<string | null> {
  // 既にキャッシュ済み（有効期限内）の場合はそのパスを返す
  const existingPath = getLocalImagePath(imageUrl);
  if (existingPath) {
    return existingPath;
  }

  ensureImageCacheDir();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'AstroBlogBot/1.0 (+https://example.com)',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Failed to fetch OGP image: ${imageUrl} (${response.status})`);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    // sharpでwebpに変換
    const cacheKey = generateCacheKey(imageUrl);
    const fileName = `${cacheKey}.webp`;
    const filePath = join(IMAGE_CACHE_DIR, fileName);

    await sharp(buffer)
      .webp({ quality: 80 })
      .toFile(filePath);

    // マニフェストを更新
    const manifest = loadManifest();
    const localPath = `/ogp-cache/${fileName}`;
    manifest.entries[imageUrl] = {
      localPath,
      cachedAt: new Date().toISOString(),
    };
    saveManifest(manifest);

    console.log(`Cached OGP image: ${imageUrl} -> ${localPath}`);
    return localPath;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.warn(`Timeout fetching OGP image: ${imageUrl}`);
      } else {
        console.warn(`Error caching OGP image: ${imageUrl}`, error.message);
      }
    }
    return null;
  }
}
