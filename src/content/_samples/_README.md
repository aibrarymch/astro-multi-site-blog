# サンプルコンテンツ

このディレクトリには、ブログシステムの機能を示すサンプル記事とスクラップが含まれています。

## 動作仕組み

- サンプルは `src/content/samples/` に格納されています
- **実際のコンテンツが存在しない場合のみ表示されます**
- `src/content/blog/` または `src/content/scraps/` に1つでもファイルを作成すると、サンプルは自動的に非表示になります
- 下書き（`draft: true`）もコンテンツとしてカウントされます

## 最初の記事を書く

1. `src/content/blog/your-post.mdx` を作成
2. または `src/content/scraps/your-scrap.mdx` を作成
3. サイトを再ビルドすると、サンプルは自動的に非表示になります

## サンプルファイル一覧

### ブログ

- **access-restrictions.mdx** - 年齢制限機能のデモ
- **long-title.mdx** - 長いタイトルの処理テスト
- **heading-sample.mdx** - 見出しスタイルと構造のデモ
- **components/index.mdx** - カスタムコンポーネントの使い方

### スクラップ

- **sample-scrap.mdx** - 完結したスクラップのフォーマット
- **sample-scrap-not-done.mdx** - 進行中のスクラップのフォーマット

## 技術的な詳細

サンプルコンテンツの表示・非表示は以下のユーティリティで制御されています：

- **`src/utils/contentDetector.ts`** - 実コンテンツの存在を検出
- **`src/utils/categoryFilter.ts`** - サンプルの条件付き読み込みを実装

実装の詳細は、プランファイル `/home/tsune/.claude/plans/atomic-sprouting-zephyr.md` を参照してください。
