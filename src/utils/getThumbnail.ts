/**
 * 記事のサムネイル画像パスを取得するユーティリティ
 *
 * frontmatterでthumbnailが未設定の場合のみ、
 * 自動生成されたOGP画像のパスを返す
 */

import { getOgpImagePathBySlug, generateTitleHash } from './ogpImageGenerator';

/**
 * 記事のサムネイル画像パスを取得
 *
 * @param slug 記事のスラッグ
 * @param thumbnail frontmatterで指定されたサムネイル（未設定の場合はundefined）
 * @param title 記事のタイトル（マニフェストにない場合のフォールバック用）
 * @returns 使用すべきサムネイル画像のパス
 */
export function getThumbnail(slug: string, thumbnail: string | undefined, title?: string): string {
  // thumbnailが明示的に設定されている場合はそれを使用
  if (thumbnail !== undefined) {
    return thumbnail;
  }

  // マニフェストからハッシュベースのパスを取得
  const manifestPath = getOgpImagePathBySlug(slug);
  if (manifestPath) {
    return manifestPath;
  }

  // マニフェストにない場合（開発中の新規記事など）
  // titleがあればハッシュを生成、なければslugベースのパスをフォールバック
  if (title) {
    const hash = generateTitleHash(title);
    return `/ogp/${hash}.png`;
  }

  // 最終フォールバック: slugベースのパス（オンデマンド生成用）
  return `/ogp/${slug}.png`;
}
