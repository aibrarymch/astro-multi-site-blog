/**
 * サイト設定に関するユーティリティ関数
 */

import { SITES, CATEGORY_THUMBNAILS, type SiteType } from '../config/sites.config';

/** カテゴリサムネイルのテーマ設定 */
interface CategoryThumbnailTheme {
  svg: string;
  bgColor: string;
}

/** カテゴリサムネイル設定 */
interface CategoryThumbnail {
  light: CategoryThumbnailTheme;
  dark: CategoryThumbnailTheme;
}

/**
 * devUrlをdevPortから自動生成
 * @param siteKey - サイトキー
 * @returns 開発用URL
 */
export function getDevUrl(siteKey: SiteType): string {
  const site = SITES[siteKey];
  return site ? `http://localhost:${site.devPort}` : 'http://localhost:4321';
}

/**
 * サイトタイプの一覧を取得
 * @returns サイトタイプの配列
 */
export function getSiteTypes(): SiteType[] {
  return Object.keys(SITES) as SiteType[];
}

/**
 * カテゴリサムネイル設定を取得
 * @param category - カテゴリ名
 * @returns カテゴリサムネイル設定
 */
export function getCategoryThumbnail(category: string): CategoryThumbnail {
  const thumbnails = CATEGORY_THUMBNAILS as Record<string, CategoryThumbnail>;
  return thumbnails[category] || thumbnails._default;
}
