/**
 * 開発サーバー起動スクリプト
 * sites.config.tsから設定を読み込み、動的にポート番号を設定
 *
 * 使用方法:
 *   npm run dev                     # 全サイトを同時起動（concurrently）
 *   npm run dev -- diary            # diaryサイトのみ起動
 *   npm run dev -- all              # allサイトのみ起動
 *   npm run dev -- --no-draft       # 全サイト起動、ドラフト記事非表示
 *   npm run dev -- diary --no-draft # diaryのみ起動、ドラフト記事非表示
 */

import { spawn } from 'child_process';
import { SITES, type SiteType } from '../src/config/sites.config';
import { getSiteTypes } from '../src/utils/siteHelpers';

const args = process.argv.slice(2);
const siteType = args.find(arg => !arg.startsWith('-') && arg !== '--no-draft');
// 引数なしの場合は全サイト同時起動
const isAllMode = !siteType;
// --no-draft オプションでドラフト記事を非表示
const showDrafts = !args.includes('--no-draft');

/**
 * 単一サイトを起動
 */
function runSingleSite(type: string): void {
  const config = SITES[type as SiteType];
  if (!config) {
    console.error(`Unknown site type: ${type}`);
    console.error(`Available types: ${getSiteTypes().join(', ')}`);
    process.exit(1);
  }

  console.log(`Starting ${type} site on port ${config.devPort}...`);

  const child = spawn('npx', ['astro', 'dev', '--port', String(config.devPort)], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, SITE_TYPE: type, SHOW_DRAFTS: String(showDrafts) }
  });

  child.on('error', (err) => {
    console.error('Failed to start dev server:', err);
    process.exit(1);
  });

  child.on('exit', (code) => {
    process.exit(code || 0);
  });
}

/**
 * 全サイトを同時起動（concurrently使用）
 */
function runAllSites(): void {
  const types = getSiteTypes();
  const colors = ['blue', 'green', 'cyan', 'magenta', 'yellow', 'red'];

  // concurrentlyコマンドを構築
  const commands = types.map((type, index) => {
    const config = SITES[type];
    const delay = index * 3; // 3秒ずつ遅延
    const delayCmd = delay > 0 ? `sleep ${delay} && ` : '';
    return `"${delayCmd}cross-env SITE_TYPE=${type} SHOW_DRAFTS=${showDrafts} astro dev --port ${config.devPort}"`;
  });

  const names = types.join(',');
  const colorList = types.map((_, i) => colors[i % colors.length]).join(',');

  const concurrentlyArgs = [
    '-n', names,
    '-c', colorList,
    ...commands
  ];

  console.log('Starting all sites concurrently...');
  types.forEach(type => {
    console.log(`  - ${type}: http://localhost:${SITES[type].devPort}`);
  });

  const child = spawn('npx', ['concurrently', ...concurrentlyArgs], {
    stdio: 'inherit',
    shell: true
  });

  child.on('error', (err) => {
    console.error('Failed to start dev servers:', err);
    process.exit(1);
  });

  child.on('exit', (code) => {
    process.exit(code || 0);
  });
}

// メイン処理
if (isAllMode) {
  runAllSites();
} else {
  runSingleSite(siteType!);
}
