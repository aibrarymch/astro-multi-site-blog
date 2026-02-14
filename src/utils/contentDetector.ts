/**
 * サンプルコンテンツ検出ユーティリティ
 * 実際のコンテンツ（blog または scraps）が存在するかチェックし、
 * サンプルコンテンツを条件付きで読み込む
 */

import { getCollection, type CollectionEntry } from 'astro:content';

// キャッシュ変数（ビルド中は何度も呼ばれるため）
let cachedHasRealContent: boolean | null = null;

/**
 * 実際のコンテンツ（blog または scraps）が存在するかチェック
 * 下書きも含めてカウントする
 *
 * @returns 実際のコンテンツが存在する場合は true、そうでなければ false
 */
export async function hasRealContent(): Promise<boolean> {
  if (cachedHasRealContent !== null) {
    return cachedHasRealContent;
  }

  const allBlog = await getCollection('blog');
  const allScraps = await getCollection('scraps');

  cachedHasRealContent = allBlog.length > 0 || allScraps.length > 0;

  // 開発モードでログ出力
  if (import.meta.env.DEV) {
    console.log(`[Content Detection] Real blog posts: ${allBlog.length}, Real scraps: ${allScraps.length}`);
    console.log(`[Content Detection] Showing samples: ${!cachedHasRealContent}`);
  }

  return cachedHasRealContent;
}

/**
 * samples コレクションからブログサンプルを取得
 * ファイルパスに 'blog/' が含まれるものを抽出
 *
 * @returns サンプルブログ記事の配列
 */
export async function getSamplePosts(): Promise<CollectionEntry<'_samples'>[]> {
  const allSamples = await getCollection('_samples');
  const blogSamples = allSamples.filter(entry => entry.id.startsWith('blog/'));

  if (import.meta.env.DEV) {
    console.log(`[Content Detection] Total samples: ${allSamples.length}`);
    console.log(`[Content Detection] Blog samples: ${blogSamples.length}`);
  }

  // slug から 'blog/' プレフィックスを削除
  return blogSamples.map(entry => ({
    ...entry,
    slug: entry.slug.replace(/^blog\//, ''),
    id: entry.id.replace(/^blog\//, '')
  }));
}

/**
 * samples コレクションからスクラップサンプルを取得
 * ファイルパスに 'scraps/' が含まれるものを抽出
 *
 * @returns サンプルスクラップの配列
 */
export async function getSampleScraps(): Promise<CollectionEntry<'_samples'>[]> {
  const allSamples = await getCollection('_samples');
  const scrapSamples = allSamples.filter(entry => entry.id.startsWith('scraps/'));

  // slug から 'scraps/' プレフィックスを削除
  return scrapSamples.map(entry => ({
    ...entry,
    slug: entry.slug.replace(/^scraps\//, ''),
    id: entry.id.replace(/^scraps\//, '')
  }));
}
