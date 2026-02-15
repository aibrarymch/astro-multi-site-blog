# Astro Multi-Site Blog

Markdownで記事を書けるシンプルなAstro製ブログテンプレートです。
1つのコードベースから複数のサイト（メイン、日記、年齢制限）を生成できます。

## 機能

- **マルチサイトビルド**: 1つのソースから複数サイトを生成
- **ダークテーマ対応**: システム設定連動 + 手動切り替え、CSS変数による色管理
- **カテゴリ/タグ分類**: 記事をカテゴリとタグで整理
- **年齢制限対応**: 年齢制限コンテンツを別サイトに分離
- **MDX対応**: Markdownにコンポーネントを埋め込み可能
- **目次自動生成**: 見出しから目次を自動生成
- **シンタックスハイライト**: コードブロックの構文強調
- **レスポンシブデザイン**: モバイル対応

## 使用技術

- [Astro](https://astro.build/) v5
- TypeScript
- MDX
- Sharp (画像最適化)

## セットアップ

```bash
npm install
```

## サイト設定

`src/config/sites.config.js` を編集してサイト設定を変更します。

```javascript
export const SITES = {
  diary: {
    url: 'https://your-diary-site.com',  // 本番URL
    devPort: 4322,                        // 開発サーバーポート
    outDir: 'dist_diary',                 // ビルド出力先
    categories: ['日記'],                  // 対象カテゴリ（nullで全て）
    ageRestricted: false,                 // 年齢制限フィルタ
  },
  adult: {
    url: 'https://your-adult-site.com',
    devPort: 4323,
    outDir: 'dist_adult',
    categories: null,
    ageRestricted: true,
  },
  all: {
    url: 'https://your-main-site.com',
    devPort: 4321,
    outDir: 'dist',
    categories: null,
    ageRestricted: null,                  // nullで全記事対象
  }
};
```

## コマンド

### 開発サーバー

```bash
npm run dev                     # 全サイト同時起動
npm run dev -- diary            # diaryのみ起動
npm run dev -- adult            # adultのみ起動
npm run dev -- all              # allサイトのみ起動
npm run dev -- --no-draft       # 全サイト起動、ドラフト記事非表示
npm run dev -- diary --no-draft # diaryのみ起動、ドラフト記事非表示
```

> デフォルトでは開発環境で `draft: true` の記事も表示されます。`--no-draft` オプションで本番同様に非表示にできます。

### ビルド

```bash
npm run build            # 全サイトをビルド
npm run build -- diary   # diaryのみビルド
npm run build -- adult   # adultのみビルド
npm run build -- all     # allサイトのみビルド
```

### プレビュー

```bash
npm run preview          # ビルド結果をプレビュー
```

## 記事の作成

`src/content/blog/` に `.md` または `.mdx` ファイルを作成します。

```markdown
---
title: 記事タイトル
excerpt: 記事の概要
category: 技術
tags: [Astro, TypeScript]
publishedAt: 2024-01-01
updatedAt: 2024-01-01
ageRestricted: false
draft: false
hideIntroToc: false
---

記事本文...
```

### frontmatter オプション

| フィールド | 型 | デフォルト | 説明 |
|---|---|---|---|
| `title` | string | （必須） | 記事タイトル |
| `excerpt` | string | （必須） | 記事の概要（最大160文字） |
| `category` | string | （必須） | カテゴリ |
| `tags` | string[] | （必須） | タグ（1つ以上） |
| `publishedAt` | date | （必須） | 公開日 |
| `updatedAt` | date | （必須） | 更新日 |
| `thumbnail` | string | − | サムネイル画像パス |
| `ageRestricted` | boolean | `false` | 年齢制限コンテンツ |
| `draft` | boolean | `false` | 下書き |
| `hideIntroToc` | boolean | `false` | 目次の「はじめに」項目を非表示にする |

## ディレクトリ構成

```
src/
  config/
    sites.config.js    # サイト設定（ここを編集）
  content/
    blog/              # 記事ファイル
  pages/
    posts/[slug].astro # 記事詳細ページ
  components/          # UIコンポーネント
  layouts/             # レイアウト
  utils/               # ユーティリティ関数
scripts/
  dev.js               # 開発サーバースクリプト
  build.js             # ビルドスクリプト
```
