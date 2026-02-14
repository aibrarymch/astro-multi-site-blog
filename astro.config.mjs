import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import rehypeWrapTables from './src/plugins/rehype-wrap-tables.js';
import rehypeExternalLinks from './src/plugins/rehype-external-links.js';
import { redirectsIntegration } from './src/integrations/redirects.ts';
import { ogpImagesIntegration } from './src/integrations/ogpImages.ts';
import { SITES } from './src/config/sites.config';
import { getDevUrl } from './src/utils/siteHelpers';

// 環境変数からサイトタイプを取得
const siteType = process.env.SITE_TYPE || 'all';

// ドラフト表示設定（デフォルトはtrue）
const showDrafts = process.env.SHOW_DRAFTS !== 'false';

// 開発モードかどうかを判定
const isDev = process.argv.includes('dev');

const config = SITES[siteType] || SITES.all;
const siteUrl = process.env.SITE_URL || (isDev ? getDevUrl(siteType) : config.url);

const createRehypePlugins = () => [
  rehypeWrapTables,
  [rehypeExternalLinks, { site: siteUrl, mark: " ⧉ " }]
];

export default defineConfig({
  site: siteUrl,
  outDir: config.outDir,
  output: 'static',
  integrations: [
    ogpImagesIntegration(),
    mdx({ rehypePlugins: createRehypePlugins() }),
    redirectsIntegration(),
    sitemap(),
  ],
  markdown: {
    syntaxHighlight: 'shiki',
    shikiConfig: {
      theme: 'min-light',
      wrap: true
    },
    rehypePlugins: createRehypePlugins()
  },
  vite: {
    define: {
      'import.meta.env.SITE_TYPE': JSON.stringify(siteType),
      'import.meta.env.SHOW_DRAFTS': JSON.stringify(showDrafts ? 'true' : 'false'),
    }
  }
});
