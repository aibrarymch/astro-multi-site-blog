import satori from 'satori';
import sharp from 'sharp';
import { createHash } from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '../..');

// OGP画像サイズ（推奨サイズ）
const OGP_WIDTH = 1200;
const OGP_HEIGHT = 630;

// キャッシュディレクトリ
const CACHE_DIR = join(PROJECT_ROOT, '.cache');

// フォント設定（.cache/fonts に配置）
const FONT_DIR = join(CACHE_DIR, 'fonts');
const FONT_PATH = join(FONT_DIR, 'NotoSansJP-Bold.ttf');
const FONT_URL = 'https://github.com/notofonts/noto-cjk/raw/main/Sans/OTF/Japanese/NotoSansCJKjp-Bold.otf';

// 出力ディレクトリ
const OUTPUT_DIR = join(PROJECT_ROOT, 'public/ogp');

// マニフェストファイル
const MANIFEST_PATH = join(CACHE_DIR, 'ogp-generated-manifest.json');

// デザイン設定（サイトの配色に合わせる）
const DESIGN = {
  background: '#f8f9fb',
  cardBackground: '#ffffff',
  titleColor: '#1f2933',
  accentColor: '#3c6e71',
  secondaryColor: '#4c566a',
  shadow: '0 12px 32px rgba(31, 41, 51, 0.12)',
};

interface OgpImageOptions {
  title: string;
  siteName?: string;
}

interface ManifestEntry {
  titleHash: string;
  title: string;
  generatedAt: string;
}

interface Manifest {
  version: number;
  entries: Record<string, ManifestEntry>;
}

/**
 * タイトルからハッシュを生成（MD5の先頭16文字）
 */
export function generateTitleHash(title: string): string {
  return createHash('md5').update(title).digest('hex').slice(0, 16);
}

/**
 * フォントをダウンロード（存在しない場合のみ）
 */
async function ensureFont(): Promise<void> {
  if (existsSync(FONT_PATH)) {
    return;
  }

  console.log('[ogp-images] Downloading font...');

  if (!existsSync(FONT_DIR)) {
    mkdirSync(FONT_DIR, { recursive: true });
  }

  const response = await fetch(FONT_URL);
  if (!response.ok) {
    throw new Error(`Failed to download font: ${response.status} ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(FONT_PATH, buffer);
  console.log('[ogp-images] Font downloaded successfully');
}

/**
 * マニフェストを読み込み
 */
export function loadManifest(): Manifest {
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
export function saveManifest(manifest: Manifest): void {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

/**
 * satori用のJSX要素を生成（カード風ミニマルデザイン）
 */
function createOgpElement(options: OgpImageOptions): Record<string, unknown> {
  const { title, siteName = 'Blog' } = options;

  return {
    type: 'div',
    props: {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: DESIGN.background,
        padding: '48px',
      },
      children: {
        type: 'div',
        props: {
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            background: DESIGN.cardBackground,
            borderRadius: '24px',
            padding: '60px 80px',
            boxShadow: DESIGN.shadow,
          },
          children: [
            // タイトル
            {
              type: 'div',
              props: {
                style: {
                  color: DESIGN.titleColor,
                  fontSize: '52px',
                  fontWeight: 700,
                  textAlign: 'center',
                  lineHeight: 1.4,
                  maxWidth: '100%',
                  wordBreak: 'break-word',
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                },
                children: title,
              },
            },
            // 区切り線
            {
              type: 'div',
              props: {
                style: {
                  width: '80px',
                  height: '4px',
                  background: DESIGN.accentColor,
                  borderRadius: '2px',
                  marginTop: '32px',
                  marginBottom: '24px',
                },
              },
            },
            // サイト名
            {
              type: 'div',
              props: {
                style: {
                  color: DESIGN.secondaryColor,
                  fontSize: '24px',
                  fontWeight: 700,
                },
                children: siteName,
              },
            },
          ],
        },
      },
    },
  };
}

/**
 * 出力ディレクトリを確保
 */
function ensureOutputDir(): void {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

/**
 * OGP画像を生成（ハッシュベースのファイル名）
 */
export async function generateOgpImage(
  slug: string,
  options: OgpImageOptions
): Promise<string> {
  ensureOutputDir();

  // フォントが存在しない場合はダウンロード
  await ensureFont();

  const titleHash = generateTitleHash(options.title);
  const outputPath = join(OUTPUT_DIR, `${titleHash}.png`);

  // フォントを読み込み
  const fontData = readFileSync(FONT_PATH);

  // SVGを生成
  const svg = await satori(createOgpElement(options), {
    width: OGP_WIDTH,
    height: OGP_HEIGHT,
    fonts: [
      {
        name: 'Noto Sans JP',
        data: fontData,
        weight: 700,
        style: 'normal',
      },
    ],
  });

  // sharpでPNGに変換
  await sharp(Buffer.from(svg)).png().toFile(outputPath);

  // マニフェストを更新
  const manifest = loadManifest();
  manifest.entries[slug] = {
    titleHash,
    title: options.title,
    generatedAt: new Date().toISOString(),
  };
  saveManifest(manifest);

  return `/ogp/${titleHash}.png`;
}

/**
 * slugからOGP画像のパスを取得（マニフェストから）
 */
export function getOgpImagePathBySlug(slug: string): string | null {
  const manifest = loadManifest();
  const entry = manifest.entries[slug];
  if (!entry) {
    return null;
  }
  return `/ogp/${entry.titleHash}.png`;
}

/**
 * OGP画像が既に存在するか確認（タイトルハッシュベース）
 */
export function ogpImageExistsByTitle(title: string): boolean {
  const titleHash = generateTitleHash(title);
  const outputPath = join(OUTPUT_DIR, `${titleHash}.png`);
  return existsSync(outputPath);
}

/**
 * 古いOGP画像を削除
 */
export function deleteOgpImage(titleHash: string): boolean {
  const imagePath = join(OUTPUT_DIR, `${titleHash}.png`);
  if (existsSync(imagePath)) {
    try {
      unlinkSync(imagePath);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * マニフェストからエントリを削除
 */
export function removeManifestEntry(slug: string): void {
  const manifest = loadManifest();
  delete manifest.entries[slug];
  saveManifest(manifest);
}
