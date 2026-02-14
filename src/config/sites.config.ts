/**
 * マルチサイト設定の唯一の正規ソース
 * サイト設定を変更する場合はこのファイルのみを編集してください
 *
 * サイトタイプの追加/削除:
 * - SITESオブジェクトにエントリを追加/削除するのみでOK
 * - 'all'は全件表示用の特別なサイトタイプのため削除不可
 */

// ============================================================================
// 型定義
// ============================================================================

/** サイト設定の型定義 */
export interface SiteConfigDefinition {
  url: string;
  devPort: number;
  outDir: string;
  categories: string[] | null;
  ageRestricted: boolean | null;
}

// ============================================================================
// 基本情報
// ============================================================================

/** サイト名 */
export const SITE_NAME = 'ブログテンプレート';

/** サイトの説明文 */
export const SITE_DESCRIPTION = 'Markdownと小さなコンポーネントで運用できるシンプルなAstro製ブログです。';

// ============================================================================
// ナビゲーション
// ============================================================================

/** フッターナビゲーションリンク */
export const FOOTER_LINKS = [
  {
    url: 'https://example.com/',
    label: 'ポートフォリオ',
    iconPaths: [
      'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71',
      'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'
    ]
  },
];

// ============================================================================
// マルチサイト設定
// ============================================================================

/**
 * サイト設定
 * 新しいサイトタイプを追加する場合はここにエントリを追加するだけでOK
 * 'all'は全件表示用の特別なサイトタイプのため必須
 */
export const SITES = {
  diary: {
    url: 'https://diary-blog.example.com',
    devPort: 4322,
    outDir: 'dist_diary',
    categories: ['日記'] as string[] | null,
    ageRestricted: false as boolean | null,
  },
  hoge: {
    url: 'https://hoge-blog.example.com',
    devPort: 4323,
    outDir: 'dist_hoge',
    categories: null as string[] | null,
    ageRestricted: true as boolean | null,
  },
  all: {
    url: 'https://blog.example.com',
    devPort: 4321,
    outDir: 'dist',
    categories: null as string[] | null,
    ageRestricted: null as boolean | null,
  },
} as const satisfies Record<string, SiteConfigDefinition>;

/** サイトタイプ（SITESのキーから自動導出） */
export type SiteType = keyof typeof SITES;

// 'all'が必ず存在することをコンパイル時にチェック
type AssertAllExists = 'all' extends SiteType ? true : never;
const _allCheck: AssertAllExists = true;

// 未使用変数警告を抑制
void _allCheck;

/** canonical URL用のメインサイトURL */
export const CANONICAL_SITE_URL = SITES.all.url;

// ============================================================================
// 記事一覧設定
// ============================================================================

/** 一覧ページの1ページあたりの記事数 */
export const POSTS_PER_PAGE = 8;

/** OGP画像キャッシュの有効期限（日数）。0以下で無期限 */
export const OGP_CACHE_MAX_AGE_DAYS = 30;

// ============================================================================
// カテゴリサムネイル設定
// ============================================================================

/**
 * カテゴリサムネイル設定
 * 記事一覧で使用するカテゴリごとのSVGアイコンと背景色
 *
 * SVGアイコンの取得方法
 * https://lucide.dev/icons/
 * 
 * light: ライトテーマ用設定
 *   - svg: SVGタグの内容（<svg>タグ自体は不要、中身のみ記述）
 *   - bgColor: 背景色（16進カラーコード）
 * dark: ダークテーマ用設定
 *   - svg: SVGタグの内容
 *   - bgColor: 背景色
 */
export const CATEGORY_THUMBNAILS = {
  'パーツ': {
    // パズルピースアイコン (Lucide: puzzle)
    light: {
      svg: `<path fill="#4f46e5" d="M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z"/>`,
      bgColor: '#c7d2fe',  // Indigo-200
    },
    dark: {
      svg: `<path fill="#a5b4fc" d="M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z"/>`,
      bgColor: '#3730a3',  // Indigo-800
    },
  },
  '日記': {
    // ペンとノートアイコン (Lucide: notebook-pen)
    light: {
      svg: `<path stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4"/><path stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" d="M2 6h4"/><path stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" d="M2 10h4"/><path stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" d="M2 14h4"/><path stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" d="M2 18h4"/><path stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/>`,
      bgColor: '#a7f3d0',  // Emerald-200
    },
    dark: {
      svg: `<path stroke="#6ee7b7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4"/><path stroke="#6ee7b7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" d="M2 6h4"/><path stroke="#6ee7b7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" d="M2 10h4"/><path stroke="#6ee7b7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" d="M2 14h4"/><path stroke="#6ee7b7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" d="M2 18h4"/><path stroke="#6ee7b7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/>`,
      bgColor: '#065f46',  // Emerald-800
    },
  },
  // デフォルト設定（マッチしないカテゴリ用）
  _default: {
    // ドキュメントアイコン (Lucide: file-text)
    light: {
      svg: `<path stroke="#475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path stroke="#475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" d="M14 2v6h6"/><path stroke="#475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" d="M16 13H8"/><path stroke="#475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" d="M16 17H8"/><path stroke="#475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" d="M10 9H8"/>`,
      bgColor: '#cbd5e1',  // Slate-300
    },
    dark: {
      svg: `<path stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" d="M14 2v6h6"/><path stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" d="M16 13H8"/><path stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" d="M16 17H8"/><path stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" d="M10 9H8"/>`,
      bgColor: '#334155',  // Slate-700
    },
  },
};



// ============================================================================
// 運営者プロフィール
// ============================================================================

/** 運営者プロフィール */
export const AUTHOR_PROFILE = {
  name: '運営者',
  avatar: 'https://placehold.jp/150x150.png',
  description: 'このブログの運営者です。',
  url: 'https://example.com/',
  links: [
    {
      url: 'https://x.com/example',
      label: 'X',
      iconPaths: ['M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z'],
      iconType: 'fill'
    },
    {
      url: 'https://pixiv.net/users/example',
      label: 'Pixiv',
      iconPaths: ['M6.5 2v20h4v-8h2.5c4 0 7.5-2.5 7.5-6s-3.5-6-7.5-6H6.5zm4 3h2.5c2 0 3.5 1.3 3.5 3s-1.5 3-3.5 3h-2.5V5z'],
      iconType: 'fill'
    },
    {
      url: 'https://example.com/',
      label: 'Portfolio',
      iconPaths: [
        'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71',
        'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'
      ],
      iconType: 'stroke'
    },
  ]
};


