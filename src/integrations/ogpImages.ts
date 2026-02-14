import type { AstroIntegration } from 'astro';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import {
  generateOgpImage,
  generateTitleHash,
  loadManifest,
  saveManifest,
  deleteOgpImage,
  removeManifestEntry,
  ogpImageExistsByTitle,
  getOgpImagePathBySlug,
} from '../utils/ogpImageGenerator';
import { SITE_NAME } from '../config/sites.config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '../..');
const BLOG_DIR = join(PROJECT_ROOT, 'src/content/blog');
const SCRAPS_DIR = join(PROJECT_ROOT, 'src/content/scraps');
const OGP_DIR = join(PROJECT_ROOT, 'public/ogp');


interface OgpImagesOptions {
  /** 既存画像をスキップするか（デフォルト: true） */
  skipExisting?: boolean;
  /** 強制再生成するか */
  force?: boolean;
}

/**
 * MDX/MD ファイルから frontmatter を解析
 */
function parseFrontmatter(content: string): Record<string, string> {
  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatterMatch) {
    return {};
  }

  const frontmatter: Record<string, string> = {};
  const lines = frontmatterMatch[1].split('\n');

  for (const line of lines) {
    // Windowsの改行コード(\r)を除去してからマッチ
    const cleanLine = line.replace(/\r$/, '');
    const match = cleanLine.match(/^(\w+):\s*(.+)$/);
    if (match) {
      let value = match[2].trim();
      // クォートを除去
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      frontmatter[match[1]] = value;
    }
  }

  return frontmatter;
}

/**
 * 指定ディレクトリからコンテンツ一覧を再帰的に取得
 */
function getPostsFromDir(dir: string, baseDir?: string): Array<{ slug: string; title: string; hasThumbnail: boolean }> {
  const posts: Array<{ slug: string; title: string; hasThumbnail: boolean }> = [];
  const rootDir = baseDir ?? dir;

  try {
    if (!existsSync(dir)) {
      return posts;
    }
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        // サブディレクトリを再帰的に検索
        posts.push(...getPostsFromDir(fullPath, rootDir));
        continue;
      }

      if (!entry.name.endsWith('.mdx') && !entry.name.endsWith('.md')) {
        continue;
      }

      const content = readFileSync(fullPath, 'utf-8');
      const frontmatter = parseFrontmatter(content);

      // slugはrootDirからの相対パス（拡張子なし）
      const relativePath = fullPath.replace(rootDir + '/', '');
      const slug = relativePath.replace(/\.(mdx?|md)$/, '');
      const title = frontmatter.title || slug;
      // thumbnailが明示的に設定されているかどうか
      const hasThumbnail = 'thumbnail' in frontmatter && frontmatter.thumbnail !== '';

      posts.push({ slug, title, hasThumbnail });
    }
  } catch (error) {
    console.error('Error reading posts from', dir, ':', error);
  }

  return posts;
}

/**
 * ブログ記事とスクラップの一覧を取得
 */
function getAllContentPosts(): Array<{ slug: string; title: string; hasThumbnail: boolean }> {
  const blogPosts = getPostsFromDir(BLOG_DIR);
  const scrapPosts = getPostsFromDir(SCRAPS_DIR);
  return [...blogPosts, ...scrapPosts];
}

/**
 * slugから記事情報を取得（ブログとスクラップ両方を検索、サブディレクトリ対応）
 */
function getPostBySlug(slug: string): { title: string; hasThumbnail: boolean } | null {
  // ブログとスクラップの両方のディレクトリを検索
  for (const dir of [BLOG_DIR, SCRAPS_DIR]) {
    // slugはサブディレクトリを含む可能性がある (例: "components/index")
    for (const ext of ['.mdx', '.md']) {
      const filePath = join(dir, `${slug}${ext}`);
      if (existsSync(filePath)) {
        const content = readFileSync(filePath, 'utf-8');
        const frontmatter = parseFrontmatter(content);
        return {
          title: frontmatter.title || slug,
          // thumbnailが明示的に設定されているかどうか
          hasThumbnail: 'thumbnail' in frontmatter && frontmatter.thumbnail !== '',
        };
      }
    }
  }
  return null;
}

/**
 * タイトルハッシュから記事情報を検索
 */
function getPostByTitleHash(targetHash: string): { slug: string; title: string } | null {
  const posts = getAllContentPosts();
  for (const post of posts) {
    if (post.hasThumbnail) continue;
    const hash = generateTitleHash(post.title);
    if (hash === targetHash) {
      return { slug: post.slug, title: post.title };
    }
  }
  return null;
}

/**
 * OGP画像を生成する共通処理（クリーンアップ機能付き）
 */
async function generateAllOgpImages(options: { skipExisting: boolean; force: boolean }): Promise<void> {
  const { skipExisting, force } = options;

  console.log('\n[ogp-images] Generating OGP images...');

  const posts = getAllContentPosts();
  const manifest = loadManifest();

  // 現在の記事のslugセットを作成（thumbnailが未設定のもののみ）
  const currentSlugs = new Set(
    posts.filter(p => !p.hasThumbnail).map(p => p.slug)
  );

  let generated = 0;
  let skipped = 0;
  let deleted = 0;
  let regenerated = 0;

  // 1. マニフェストにあるが記事にないエントリを削除
  for (const [slug, entry] of Object.entries(manifest.entries)) {
    if (!currentSlugs.has(slug)) {
      // 記事が削除されたか、thumbnailが設定された
      if (deleteOgpImage(entry.titleHash)) {
        console.log(`  [ogp-images] Deleted orphan: ${entry.titleHash}.png (was: ${slug})`);
        deleted++;
      }
      removeManifestEntry(slug);
    }
  }

  // 2. 各記事を処理
  for (const post of posts) {
    // thumbnailが明示的に設定されている場合はスキップ
    if (post.hasThumbnail && !force) {
      skipped++;
      continue;
    }

    const existingEntry = manifest.entries[post.slug];
    const currentTitleHash = generateTitleHash(post.title);

    // タイトルが変更された場合は古い画像を削除して再生成
    if (existingEntry && existingEntry.titleHash !== currentTitleHash) {
      if (deleteOgpImage(existingEntry.titleHash)) {
        console.log(`  [ogp-images] Deleted old: ${existingEntry.titleHash}.png (title changed)`);
      }
      try {
        await generateOgpImage(post.slug, {
          title: post.title,
          siteName: SITE_NAME,
        });
        regenerated++;
        console.log(`  [ogp-images] Regenerated: ${post.slug} -> ${currentTitleHash}.png`);
      } catch (error) {
        console.error(`  [ogp-images] Error regenerating OGP for ${post.slug}:`, error);
      }
      continue;
    }

    // 既存画像をスキップ（タイトルハッシュベースでチェック）
    if (skipExisting && !force && ogpImageExistsByTitle(post.title)) {
      skipped++;
      continue;
    }

    // 新規生成
    try {
      await generateOgpImage(post.slug, {
        title: post.title,
        siteName: SITE_NAME,
      });
      generated++;
      console.log(`  [ogp-images] Generated: ${post.slug} -> ${currentTitleHash}.png`);
    } catch (error) {
      console.error(`  [ogp-images] Error generating OGP for ${post.slug}:`, error);
    }
  }

  console.log(`[ogp-images] Done: ${generated} new, ${regenerated} regenerated, ${deleted} deleted, ${skipped} skipped\n`);
}

/**
 * OGP画像を生成するAstroインテグレーション
 */
export function ogpImagesIntegration(options: OgpImagesOptions = {}): AstroIntegration {
  const { skipExisting = true, force = false } = options;

  return {
    name: 'ogp-images',
    hooks: {
      // ビルド時に画像生成
      'astro:build:start': async () => {
        await generateAllOgpImages({ skipExisting, force });
      },
      // 開発サーバー起動時にも画像生成
      'astro:server:start': async () => {
        await generateAllOgpImages({ skipExisting, force });
      },
      // 開発サーバーでオンデマンド生成（新規記事対応）
      'astro:server:setup': ({ server }) => {
        server.middlewares.use(async (req, res, next) => {
          const url = req.url;

          // /ogp/*.png へのリクエストのみ処理
          if (!url || !url.startsWith('/ogp/') || !url.endsWith('.png')) {
            return next();
          }

          // ファイル名を抽出（ハッシュまたはslug）
          const fileName = url.replace('/ogp/', '').replace('.png', '');
          const imagePath = join(OGP_DIR, `${fileName}.png`);

          // 画像が既に存在する場合はスキップ
          if (existsSync(imagePath)) {
            return next();
          }

          // ハッシュ形式かどうかをチェック（16文字の16進数）
          const isHash = /^[a-f0-9]{16}$/.test(fileName);

          let slug: string;
          let title: string;

          if (isHash) {
            // ハッシュから記事を検索
            const post = getPostByTitleHash(fileName);
            if (!post) {
              return next();
            }
            slug = post.slug;
            title = post.title;
          } else {
            // slugとして扱う（レガシー対応）
            const post = getPostBySlug(fileName);
            if (!post || post.hasThumbnail) {
              return next();
            }
            slug = fileName;
            title = post.title;
          }

          try {
            console.log(`[ogp-images] On-demand generating: ${slug} -> ${fileName}.png`);
            await generateOgpImage(slug, {
              title: title,
              siteName: SITE_NAME,
            });
            // 生成後、Viteに処理を続行させる
            return next();
          } catch (error) {
            console.error(`[ogp-images] Error generating OGP for ${slug}:`, error);
            return next();
          }
        });
      },
    },
  };
}
