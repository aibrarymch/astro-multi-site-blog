import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getSortedFilteredPosts, getSortedFilteredScraps } from '../utils/categoryFilter';
import { SITE_NAME, SITE_DESCRIPTION, AUTHOR_PROFILE } from '../utils/siteConfig';

export async function GET(context: APIContext) {
  const posts = await getSortedFilteredPosts();
  const scraps = await getSortedFilteredScraps();

  const postItems = posts.map((post) => ({
    title: post.data.title,
    pubDate: post.data.publishedAt,
    description: post.data.excerpt,
    link: `/posts/${post.slug}/`,
    author: AUTHOR_PROFILE.name,
    customData: post.data.updatedAt
      ? `<atom:updated>${post.data.updatedAt.toISOString()}</atom:updated>`
      : undefined,
  }));

  const scrapItems = scraps.map((scrap) => ({
    title: scrap.data.title,
    pubDate: scrap.data.publishedAt,
    description: scrap.data.excerpt,
    link: `/scraps/${scrap.slug}/`,
    author: AUTHOR_PROFILE.name,
    customData: scrap.data.updatedAt
      ? `<atom:updated>${scrap.data.updatedAt.toISOString()}</atom:updated>`
      : undefined,
  }));

  const allEntries = [
    ...posts.map((post, i) => ({ item: postItems[i], sortDate: post.data.updatedAt ?? post.data.publishedAt })),
    ...scraps.map((scrap, i) => ({ item: scrapItems[i], sortDate: scrap.data.updatedAt ?? scrap.data.publishedAt })),
  ];
  allEntries.sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());
  const items = allEntries.map((e) => e.item);

  return rss({
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    site: context.site!,
    items,
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    customData: `<language>ja</language>`,
  });
}
