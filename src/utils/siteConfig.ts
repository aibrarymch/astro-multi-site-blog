/**
 * マルチサイトビルド設定
 * 設定は src/config/sites.config.js で一元管理
 * このファイルはTypeScript型とヘルパー関数を提供
 */

import {
  SITES,
  SITE_NAME as _SITE_NAME,
  SITE_DESCRIPTION as _SITE_DESCRIPTION,
  FOOTER_LINKS as _FOOTER_LINKS,
  CANONICAL_SITE_URL as _CANONICAL_SITE_URL,
  AUTHOR_PROFILE as _AUTHOR_PROFILE,
  POSTS_PER_PAGE as _POSTS_PER_PAGE,
  type SiteType,
} from '../config/sites.config';
import { getDevUrl } from './siteHelpers';

/** 一覧ページの1ページあたりの記事数 */
export const POSTS_PER_PAGE = _POSTS_PER_PAGE;

// 設定値を再エクスポート
export const SITE_NAME = _SITE_NAME;
export const SITE_DESCRIPTION = _SITE_DESCRIPTION;
export const CANONICAL_SITE_URL = _CANONICAL_SITE_URL;

/** サイトのURL（メインサイト） */
export const SITE_URL = SITES.all.url;

/** フッターナビゲーションリンク */
export interface FooterLink {
  url: string;
  label: string;
  /** リンクアイコン（SVGのpath要素のd属性） */
  iconPaths: string[];
}

export const FOOTER_LINKS: FooterLink[] = _FOOTER_LINKS as FooterLink[];

/** 運営者プロフィールのリンク */
export interface AuthorLink {
  url: string;
  label: string;
  iconPaths: string[];
  iconType: 'fill' | 'stroke';
}

/** 運営者プロフィール */
export interface AuthorProfile {
  name: string;
  avatar: string;
  /** SEO用: 筆者の説明文 */
  description: string;
  /** SEO用: 筆者のURL（ポートフォリオなど） */
  url: string;
  links: AuthorLink[];
}

/**
 * JSON-LD用のsameAsリンク配列を生成
 * SNSリンクからURLのみを抽出
 */
export function getAuthorSameAs(): string[] {
  return AUTHOR_PROFILE.links.map(link => link.url);
}

export const AUTHOR_PROFILE: AuthorProfile = _AUTHOR_PROFILE as AuthorProfile;

// SiteType型はsites.config.tsから再エクスポート
export type { SiteType };

export interface SiteConfigItem {
  url: string;
  devUrl: string;
  devPort: number;
  outDir: string;
  categories: string[] | null;
  ageRestricted: boolean | null;
}

// sites.config.tsから設定を読み込み、TypeScript型を付与
export const SITE_CONFIG: Record<SiteType, SiteConfigItem> = Object.fromEntries(
  Object.entries(SITES).map(([key, value]) => [
    key,
    {
      ...value,
      devUrl: getDevUrl(key as SiteType),
    } as SiteConfigItem
  ])
) as Record<SiteType, SiteConfigItem>;

/**
 * 開発環境かどうかを判定
 */
export function isDev(): boolean {
  return import.meta.env.DEV;
}

/**
 * ドラフト記事を表示するかどうかを判定
 * 開発環境かつSHOW_DRAFTS環境変数がfalseでない場合に表示
 */
export function shouldShowDrafts(): boolean {
  if (!isDev()) return false;
  // SHOW_DRAFTS環境変数が'false'の場合は非表示
  return import.meta.env.SHOW_DRAFTS !== 'false';
}

/**
 * 指定されたサイト設定の適切なURL（dev/prod）を取得
 */
export function getSiteUrl(config: SiteConfigItem): string {
  return isDev() ? config.devUrl : config.url;
}

/**
 * 現在のサイトタイプを取得
 */
export function getSiteType(): SiteType {
  const type = import.meta.env.SITE_TYPE || 'all';
  if (!(type in SITES)) {
    console.warn(`Unknown SITE_TYPE: ${type}, falling back to 'all'`);
    return 'all';
  }
  return type as SiteType;
}

/**
 * 現在のビルド設定を取得
 */
export function getCurrentConfig(): SiteConfigItem {
  return SITE_CONFIG[getSiteType()];
}

/**
 * 現在のビルド対象カテゴリを取得
 */
export function getTargetCategories(): string[] | null {
  return getCurrentConfig().categories;
}

/**
 * 現在のビルド対象のageRestricted設定を取得
 */
export function getTargetAgeRestricted(): boolean | null {
  return getCurrentConfig().ageRestricted;
}

/**
 * ageRestricted: true のサイト設定を取得
 */
export function getAdultSiteConfig(): SiteConfigItem | null {
  for (const [, config] of Object.entries(SITE_CONFIG)) {
    if (config.ageRestricted === true) {
      return config;
    }
  }
  return null;
}

/**
 * 記事のURLを取得（ageRestricted: trueの記事は該当サイトのURLを返す）
 * @param slug 記事のスラッグ
 * @param isAgeRestricted 記事のageRestricted設定
 * @returns 適切なサイトのURL
 */
export function getPostUrl(slug: string, isAgeRestricted: boolean): string {
  const siteType = getSiteType();

  // allサイトでageRestricted: trueの記事の場合、年齢制限サイトのURLを返す
  if (siteType === 'all' && isAgeRestricted) {
    const adultConfig = getAdultSiteConfig();
    if (adultConfig) {
      const baseUrl = getSiteUrl(adultConfig);
      return `${baseUrl}/posts/${slug}/`;
    }
  }

  // それ以外は現在のサイトの相対パス
  return `/posts/${slug}/`;
}

/**
 * canonical URLを取得
 * @param pathname 現在のパス
 * @param isAgeRestricted 記事のageRestricted設定（記事ページの場合）
 * @returns canonical URL、または同じサイトの場合はnull（タグ不要）
 */
export function getCanonicalUrl(pathname: string, isAgeRestricted?: boolean): string | null {
  const siteType = getSiteType();
  const currentConfig = getCurrentConfig();

  // 年齢制限サイトでageRestricted: trueの記事の場合、canonicalは自身（タグ不要）
  if (siteType !== 'all' && currentConfig.ageRestricted === true && isAgeRestricted === true) {
    return null; // canonicalタグ不要
  }

  // allサイトの場合、canonicalは自身（タグ不要）
  if (siteType === 'all') {
    return null;
  }

  // その他のサブドメインサイトはメインサイトをcanonicalに
  return `${CANONICAL_SITE_URL}${pathname}`;
}

/**
 * リスティングページを生成するか判定
 * allサイトのみリスティングページを生成
 */
export function shouldGenerateListingPages(): boolean {
  return getSiteType() === 'all';
}

/**
 * 記事がサイト条件に一致するか判定
 */
function matchesSiteCondition(
  post: { ageRestricted: boolean; category: string },
  config: SiteConfigItem
): boolean {
  // カテゴリフィルタ
  if (config.categories !== null && !config.categories.includes(post.category)) {
    return false;
  }
  // 年齢制限フィルタ
  if (config.ageRestricted !== null && post.ageRestricted !== config.ageRestricted) {
    return false;
  }
  return true;
}

/**
 * 記事がこのサイトで詳細ページを生成すべきか判定
 */
export function shouldGeneratePostDetail(post: { ageRestricted: boolean; category: string }): boolean {
  const siteType = getSiteType();
  const config = getCurrentConfig();

  if (siteType === 'all') {
    // ALLでは、他のサブサイト条件に一致しない記事のみ生成
    // サブサイト条件に一致する記事はそれぞれのサイトで生成
    for (const [type, cfg] of Object.entries(SITE_CONFIG)) {
      if (type === 'all') continue;
      if (matchesSiteCondition(post, cfg)) {
        return false; // 他サイトで生成するためスキップ
      }
    }
    return true;
  }

  // サブサイトでは自分の条件に一致する記事のみ生成
  return matchesSiteCondition(post, config);
}

/**
 * 記事詳細ページのURLを取得（適切なドメインを返す）
 */
export function getPostDetailUrl(slug: string, post: { ageRestricted: boolean; category: string }): string {
  // 記事がどのサイトで生成されるか判定
  for (const [type, config] of Object.entries(SITE_CONFIG)) {
    if (type === 'all') continue;
    if (matchesSiteCondition(post, config)) {
      const baseUrl = getSiteUrl(config);
      return `${baseUrl}/posts/${slug}/`;
    }
  }
  // どのサブサイトにも該当しない場合はALLサイト
  const allConfig = SITE_CONFIG['all'];
  const baseUrl = getSiteUrl(allConfig);
  return `${baseUrl}/posts/${slug}/`;
}

/**
 * スクラップがこのサイトで詳細ページを生成すべきか判定
 */
export function shouldGenerateScrapDetail(scrap: { ageRestricted: boolean; category: string }): boolean {
  const siteType = getSiteType();
  const config = getCurrentConfig();

  if (siteType === 'all') {
    // ALLでは、他のサブサイト条件に一致しないスクラップのみ生成
    for (const [type, cfg] of Object.entries(SITE_CONFIG)) {
      if (type === 'all') continue;
      if (matchesSiteCondition(scrap, cfg)) {
        return false;
      }
    }
    return true;
  }

  // サブサイトでは自分の条件に一致するスクラップのみ生成
  return matchesSiteCondition(scrap, config);
}

/**
 * スクラップ詳細ページのURLを取得（適切なドメインを返す）
 */
export function getScrapDetailUrl(slug: string, scrap: { ageRestricted: boolean; category: string }): string {
  // スクラップがどのサイトで生成されるか判定
  for (const [type, config] of Object.entries(SITE_CONFIG)) {
    if (type === 'all') continue;
    if (matchesSiteCondition(scrap, config)) {
      const baseUrl = getSiteUrl(config);
      return `${baseUrl}/scraps/${slug}/`;
    }
  }
  // どのサブサイトにも該当しない場合はALLサイト
  const allConfig = SITE_CONFIG['all'];
  const baseUrl = getSiteUrl(allConfig);
  return `${baseUrl}/scraps/${slug}/`;
}
