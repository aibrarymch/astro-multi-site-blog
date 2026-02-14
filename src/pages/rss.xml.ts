import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getSortedFilteredPosts } from '../utils/categoryFilter';
import { SITE_NAME, SITE_DESCRIPTION, AUTHOR_PROFILE } from '../utils/siteConfig';

export async function GET(context: APIContext) {
  const posts = await getSortedFilteredPosts();

  return rss({
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.publishedAt,
      description: post.data.excerpt,
      link: `/posts/${post.slug}/`,
      author: AUTHOR_PROFILE.name,
    })),
    customData: `<language>ja</language>`,
  });
}
