/**
 * ビルドスクリプト
 * sites.config.tsから設定を読み込み、指定されたサイトをビルド
 *
 * 使用方法:
 *   npm run build              # 全サイトを順番にビルド
 *   npm run build -- diary     # 指定サイトのみビルド
 *   npm run build -- all       # allサイトのみビルド
 */

import { spawn } from 'child_process';
import { SITES, type SiteType } from '../src/config/sites.config';
import { getSiteTypes } from '../src/utils/siteHelpers';

const args = process.argv.slice(2);
const siteType = args.find(arg => !arg.startsWith('-'));
// 引数なしの場合は全サイトビルド
const isBuildAll = !siteType;

/**
 * 単一サイトをビルド
 */
function buildSite(type: SiteType): Promise<void> {
  return new Promise((resolve, reject) => {
    const config = SITES[type];
    if (!config) {
      console.error(`Unknown site type: ${type}`);
      console.error(`Available types: ${getSiteTypes().join(', ')}`);
      reject(new Error(`Unknown site type: ${type}`));
      return;
    }

    console.log(`\nBuilding ${type} site...`);
    console.log(`  Output: ${config.outDir}`);

    const child = spawn('npx', ['astro', 'build'], {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, SITE_TYPE: type }
    });

    child.on('error', (err) => {
      console.error(`Failed to build ${type}:`, err);
      reject(err);
    });

    child.on('exit', (code) => {
      if (code === 0) {
        console.log(`✓ ${type} build complete`);
        resolve();
      } else {
        reject(new Error(`Build failed with code ${code}`));
      }
    });
  });
}

/**
 * 全サイトを順番にビルド
 */
async function buildAllSites(): Promise<void> {
  const types = getSiteTypes();
  console.log('Building all sites...');

  for (const type of types) {
    await buildSite(type);
  }

  console.log('\n✓ All sites built successfully');
}

// メイン処理
async function main(): Promise<void> {
  try {
    if (isBuildAll) {
      await buildAllSites();
    } else {
      await buildSite((siteType || 'all') as SiteType);
    }
  } catch (err) {
    console.error('Build failed:', (err as Error).message);
    process.exit(1);
  }
}

main();
