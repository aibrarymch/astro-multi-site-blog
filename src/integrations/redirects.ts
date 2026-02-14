import type { AstroIntegration } from 'astro';
import { writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { join } from 'path';
import { SITE_CONFIG } from '../utils/siteConfig';

/**
 * Cloudflare Pages用の_redirectsファイルを動的に生成するAstro統合
 * - ALLサイト: ページネーション用リダイレクト（/ → /1/ など）
 * - ALL以外のサイト: 404時にALLサイトにリダイレクト
 */
export function redirectsIntegration(): AstroIntegration {
  return {
    name: 'redirects',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const siteType = process.env.SITE_TYPE || 'all';
        const outputPath = join(fileURLToPath(dir), '_redirects');

        let redirectsContent = '';

        if (siteType === 'all') {
          // ALLサイト: ページネーション用リダイレクトを生成
          redirectsContent = generatePaginationRedirects(dir);
        } else {
          // ALL以外: 404リダイレクト
          const allSiteUrl = SITE_CONFIG['all'].url;
          redirectsContent = `# ${siteType} site: redirect 404 to ALL site
/* ${allSiteUrl}/:splat 302
`;
        }

        if (redirectsContent) {
          writeFileSync(outputPath, redirectsContent);
          console.log(`Generated _redirects for ${siteType} site`);
        }
      }
    }
  };
}

/**
 * ページネーション用のリダイレクトルールを生成
 * ビルド結果のディレクトリ構造から動的に生成
 */
function generatePaginationRedirects(dir: URL): string {
  const outputDir = fileURLToPath(dir);
  const rules: string[] = ['# Pagination redirects'];

  // カテゴリページのリダイレクトを生成
  const categoriesDir = join(outputDir, 'categories');
  if (existsSync(categoriesDir)) {
    const entries = readdirSync(categoriesDir);
    for (const entry of entries) {
      const entryPath = join(categoriesDir, entry);
      if (statSync(entryPath).isDirectory()) {
        // /categories/カテゴリ名/ → /categories/カテゴリ名/1/
        rules.push(`/categories/${entry} /categories/${entry}/1/ 301`);
        rules.push(`/categories/${entry}/ /categories/${entry}/1/ 301`);
      }
    }
  }

  // タグページのリダイレクトを生成
  const tagsDir = join(outputDir, 'tags');
  if (existsSync(tagsDir)) {
    const entries = readdirSync(tagsDir);
    for (const entry of entries) {
      const entryPath = join(tagsDir, entry);
      if (statSync(entryPath).isDirectory()) {
        // /tags/タグ名/ → /tags/タグ名/1/
        rules.push(`/tags/${entry} /tags/${entry}/1/ 301`);
        rules.push(`/tags/${entry}/ /tags/${entry}/1/ 301`);
      }
    }
  }

  rules.push('');
  return rules.join('\n');
}
