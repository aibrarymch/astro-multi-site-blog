/**
 * カテゴリフィルタリングユーティリティ
 * マルチサイトビルド時に記事をカテゴリ・年齢制限でフィルタリング
 */

import { getCollection, type CollectionEntry } from 'astro:content';
import { getTargetCategories, getTargetAgeRestricted, shouldShowDrafts, shouldGeneratePostDetail, shouldGenerateScrapDetail } from './siteConfig';
import { hasRealContent, getSamplePosts, getSampleScraps } from './contentDetector';

/**
 * ブログ記事とスクラップの統合型
 */
export type UnifiedPost =
  | { type: 'blog'; entry: CollectionEntry<'blog'> }
  | { type: 'scrap'; entry: CollectionEntry<'scraps'> };

/**
 * 記事が現在のビルド対象に含まれるか判定
 */
export function isPostIncluded(post: CollectionEntry<'blog'>): boolean {
  // カテゴリフィルタ
  const categories = getTargetCategories();
  if (categories !== null && !categories.includes(post.data.category)) {
    return false;
  }

  // 年齢制限フィルタ
  const ageRestricted = getTargetAgeRestricted();
  if (ageRestricted !== null && post.data.ageRestricted !== ageRestricted) {
    return false;
  }

  return true;
}

/**
 * フィルタリング済みの記事コレクションを取得
 * - ドラフトを除外（shouldShowDrafts()がtrueの場合は表示）
 * - カテゴリフィルタを適用
 * - 年齢制限フィルタを適用
 * - 実コンテンツがない場合はサンプルを返す
 */
export async function getFilteredPosts(): Promise<(CollectionEntry<'blog'> | CollectionEntry<'_samples'>)[]> {
  const posts = await getCollection('blog', (entry) => {
    // shouldShowDrafts()がfalseの場合はdraft記事を除外
    if (!shouldShowDrafts() && entry.data.draft) return false;
    return isPostIncluded(entry);
  });

  // 実コンテンツがあればそれを返す
  if (await hasRealContent()) {
    return posts;
  }

  // 実コンテンツがない場合はサンプルを返す
  const samples = await getSamplePosts();
  return samples.filter((entry) => {
    if (!shouldShowDrafts() && entry.data.draft) return false;
    return isPostIncluded(entry as any);
  });
}

/**
 * 全記事を取得（フィルタリングなし）
 * カテゴリ/タグの件数集計用（ALLサイト基準）
 * - 実コンテンツがない場合はサンプルを返す
 */
export async function getAllPosts(): Promise<(CollectionEntry<'blog'> | CollectionEntry<'_samples'>)[]> {
  const posts = await getCollection('blog', (entry) => {
    if (!shouldShowDrafts() && entry.data.draft) return false;
    return true;
  });

  // 実コンテンツがあればそれを返す
  if (await hasRealContent()) {
    return posts;
  }

  // 実コンテンツがない場合はサンプルを返す
  const samples = await getSamplePosts();
  return samples.filter((entry) => {
    if (!shouldShowDrafts() && entry.data.draft) return false;
    return true;
  });
}

/**
 * 日付でソートされたフィルタリング済み記事を取得
 */
export async function getSortedFilteredPosts(): Promise<CollectionEntry<'blog'>[]> {
  const posts = await getFilteredPosts();
  return posts.sort(
    (a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime()
  );
}

/**
 * 記事詳細ページ用のフィルタリング
 * - サイトタイプに応じて生成すべき記事のみを返す
 * - 実コンテンツがない場合はサンプルを返す
 */
export async function getPostsForDetailPages(): Promise<(CollectionEntry<'blog'> | CollectionEntry<'_samples'>)[]> {
  const posts = await getCollection('blog', (entry) => {
    if (!shouldShowDrafts() && entry.data.draft) return false;
    return shouldGeneratePostDetail(entry.data);
  });

  // 実コンテンツがあればそれを返す
  if (await hasRealContent()) {
    return posts;
  }

  // 実コンテンツがない場合はサンプルを返す
  const samples = await getSamplePosts();
  return samples.filter((entry) => {
    if (!shouldShowDrafts() && entry.data.draft) return false;
    return shouldGeneratePostDetail(entry.data as any);
  });
}

/**
 * フィルタリング済み記事とスクラップからカテゴリとタグの集計を取得
 */
export function aggregateTaxonomy(
  posts: CollectionEntry<'blog'>[],
  scraps: CollectionEntry<'scraps'>[] = []
) {
  const categoryMap = new Map<string, number>();
  const tagMap = new Map<string, number>();

  for (const post of posts) {
    const { category, tags } = post.data;
    categoryMap.set(category, (categoryMap.get(category) ?? 0) + 1);
    for (const tag of tags) {
      tagMap.set(tag, (tagMap.get(tag) ?? 0) + 1);
    }
  }

  for (const scrap of scraps) {
    const { category, tags } = scrap.data;
    categoryMap.set(category, (categoryMap.get(category) ?? 0) + 1);
    for (const tag of tags) {
      tagMap.set(tag, (tagMap.get(tag) ?? 0) + 1);
    }
  }

  const categories = Array.from(categoryMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const tags = Array.from(tagMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return { categories, tags };
}

/**
 * スクラップが現在のビルド対象に含まれるか判定
 */
export function isScrapIncluded(scrap: CollectionEntry<'scraps'>): boolean {
  // カテゴリフィルタ
  const categories = getTargetCategories();
  if (categories !== null && !categories.includes(scrap.data.category)) {
    return false;
  }

  // 年齢制限フィルタ
  const ageRestricted = getTargetAgeRestricted();
  if (ageRestricted !== null && scrap.data.ageRestricted !== ageRestricted) {
    return false;
  }

  return true;
}

/**
 * フィルタリング済みのスクラップコレクションを取得
 * - 実コンテンツがない場合はサンプルを返す
 */
export async function getFilteredScraps(): Promise<(CollectionEntry<'scraps'> | CollectionEntry<'_samples'>)[]> {
  const scraps = await getCollection('scraps', (entry) => {
    if (!shouldShowDrafts() && entry.data.draft) return false;
    return isScrapIncluded(entry);
  });

  // 実コンテンツがあればそれを返す
  if (await hasRealContent()) {
    return scraps;
  }

  // 実コンテンツがない場合はサンプルを返す
  const samples = await getSampleScraps();
  return samples.filter((entry) => {
    if (!shouldShowDrafts() && entry.data.draft) return false;
    return isScrapIncluded(entry as any);
  });
}

/**
 * 日付でソートされたフィルタリング済みスクラップを取得
 */
export async function getSortedFilteredScraps(): Promise<CollectionEntry<'scraps'>[]> {
  const scraps = await getFilteredScraps();
  return scraps.sort(
    (a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime()
  );
}

/**
 * スクラップ詳細ページ用のフィルタリング
 * - 実コンテンツがない場合はサンプルを返す
 */
export async function getScrapsForDetailPages(): Promise<(CollectionEntry<'scraps'> | CollectionEntry<'_samples'>)[]> {
  const scraps = await getCollection('scraps', (entry) => {
    if (!shouldShowDrafts() && entry.data.draft) return false;
    return shouldGenerateScrapDetail(entry.data);
  });

  // 実コンテンツがあればそれを返す
  if (await hasRealContent()) {
    return scraps;
  }

  // 実コンテンツがない場合はサンプルを返す
  const samples = await getSampleScraps();
  return samples.filter((entry) => {
    if (!shouldShowDrafts() && entry.data.draft) return false;
    return shouldGenerateScrapDetail(entry.data as any);
  });
}

/**
 * ブログ記事とスクラップを統合してソートされたリストを取得
 * - 実コンテンツがない場合はサンプルを返す
 */
export async function getSortedFilteredUnifiedPosts(): Promise<UnifiedPost[]> {
  const blogPosts = await getFilteredPosts();
  const scraps = await getFilteredScraps();

  const unified: UnifiedPost[] = [
    ...blogPosts.map(entry => ({
      type: 'blog' as const,
      entry: entry as CollectionEntry<'blog'>
    })),
    ...scraps.map(entry => ({
      type: 'scrap' as const,
      entry: entry as CollectionEntry<'scraps'>
    })),
  ];

  return unified.sort((a, b) => {
    const dateA = a.entry.data.publishedAt.getTime();
    const dateB = b.entry.data.publishedAt.getTime();
    return dateB - dateA;
  });
}
