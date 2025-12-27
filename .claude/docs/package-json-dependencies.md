# package.json 依存関係ドキュメント

このドキュメントは Copy as Markdown プロジェクトの `package.json` に定義された依存関係を説明する。

## 概要

| 区分 | パッケージ数 | 用途 |
|------|-------------|------|
| dependencies | 1 | 本番ランタイムで必要 |
| devDependencies | 18 | 開発・ビルド・テスト用 |

## dependencies（本番依存）

### mustache ^4.2.0

**用途**: テンプレートエンジン。カスタムフォーマット機能で Markdown 出力をカスタマイズする際に使用。

**使用箇所**:
- `src/lib/custom-format.ts` - カスタムフォーマットのテンプレート処理
- `src/shims/mustache.js` - ブラウザ用 shim

**ビルド時の処理**:
- `scripts/postinstall.js` で `node_modules/mustache/mustache.mjs` を `src/vendor/mustache.mjs` にコピー
- 拡張機能にバンドルされる

## devDependencies（開発依存）

### 型定義パッケージ

| パッケージ | 用途 |
|-----------|------|
| `@types/chrome` ^0.1.31 | Chrome 拡張機能 API の型定義 |
| `@types/firefox-webext-browser` ^143.0.0 | Firefox WebExtensions API の型定義 |
| `@types/mustache` ^4.2.6 | mustache ライブラリの型定義 |
| `@types/nodemon` ^1.19.6 | nodemon の型定義 |
| `@types/turndown` ^5.0.5 | turndown ライブラリの型定義 |

**使用箇所**:
- `tsconfig.json` の `types` フィールドで `chrome` と `firefox-webext-browser` を指定
- TypeScript コンパイル時に自動的に参照

---

### ビルドツール

#### typescript ^5.4.0

**用途**: TypeScript コンパイラ。ソースコードを JavaScript にトランスパイル。

**使用箇所**:
- `npm run build:ts` - `tsc` コマンドで `src/` を `dist/` にコンパイル
- `npm run typecheck` - 型チェックのみ実行

**設定ファイル**: `tsconfig.json`

#### tsx ^4.20.6

**用途**: TypeScript 実行ツール。ビルドせずに TypeScript を直接実行。

**使用箇所**:
- 開発時のスクリプト実行（必要に応じて使用可能）
- `node` の代替として TypeScript ファイルを直接実行

#### nodemon ^3.1.0

**用途**: ファイル変更監視ツール。ソース変更時に自動再コンパイル。

**使用箇所**:
- `scripts/debug.js` - 開発中のホットリロード
  - ソースファイル変更を監視
  - 変更検出時に `scripts/compile.js` を再実行

---

### テストツール

#### vitest ^3.2.4

**用途**: 単体テストフレームワーク。Vite ベースの高速テストランナー。

**使用箇所**:
- `npm run test` - 単体テスト実行
- `npm run test:watch` - ウォッチモード
- `npm run test:ui` - UI モード

**設定ファイル**: `vitest.config.ts`

**テストファイル**: `test/**/*.test.ts`

#### @vitest/browser ^3.2.4

**用途**: Vitest のブラウザテストサポート。実際のブラウザでテスト実行。

**使用箇所**:
- `vitest.config.ts` の `browser` プロジェクト設定
- `test/ui/**/*.spec.ts` のブラウザテスト

#### @vitest/ui ^3.2.4

**用途**: Vitest の Web UI。テスト結果をブラウザで視覚的に確認。

**使用箇所**:
- `npm run test:ui` で起動

#### @playwright/test ^1.57.0

**用途**: E2E テストフレームワーク。ブラウザ拡張機能の統合テスト。

**使用箇所**:
- `npm run test:e2e` - E2E テスト実行
- `test/e2e/` ディレクトリのテストファイル

**設定ファイル**: `playwright.config.ts`

#### playwright ^1.57.0

**用途**: Playwright ブラウザ自動化ライブラリ本体。

**使用箇所**:
- `@playwright/test` の依存
- `vitest.config.ts` のブラウザプロバイダー

#### baseline-browser-mapping ^2.9.11

**用途**: ブラウザバージョンマッピング。Vitest ブラウザテストの内部依存。

**使用箇所**:
- `@vitest/browser` の依存として間接的に使用
- 直接インポートはなし

---

### リント・フォーマット

#### eslint ^9.37.0

**用途**: JavaScript/TypeScript リンター。コード品質チェック。

**使用箇所**:
- `npm run lint` - リントチェック
- `npm run lint:fix` - 自動修正

#### @antfu/eslint-config ^5.4.1

**用途**: ESLint 設定プリセット。Anthony Fu 氏の推奨設定。

**使用箇所**:
- `eslint.config.js` でインポート・設定
- TypeScript サポート、スタイル設定を含む

**特徴**:
- Prettier 不要（スタイルルール内蔵）
- TypeScript 対応
- インデント: 2スペース、セミコロン: あり、クォート: シングル

#### eslint-config-prettier ^10.1.8

**用途**: Prettier との競合ルール無効化。

**使用箇所**:
- 現在は `@antfu/eslint-config` がスタイル処理するため、互換性のために残存

---

### ブラウザ拡張開発ツール

#### http-server ^14.1.1

**用途**: シンプルな HTTP サーバー。E2E テスト用フィクスチャ配信。

**使用箇所**:
- `playwright.config.ts` の `webServer` 設定
- `npx http-server fixtures -p 5566` でテスト用ページを配信

---

### ランタイムライブラリ（ビルド時にバンドル）

以下のパッケージは devDependencies だが、ビルド時に `src/vendor/` にコピーされ拡張機能にバンドルされる。

#### turndown ^7.1.3

**用途**: HTML → Markdown 変換ライブラリ。選択範囲のコピー機能で使用。

**使用箇所**:
- `src/content-scripts/selection-to-markdown.ts` - コンテンツスクリプトで HTML を Markdown に変換
- `src/services/selection-converter-service.ts` - 変換サービス

**ビルド時の処理**:
- `scripts/postinstall.js` で `turndown.browser.es.js` を `src/vendor/turndown.mjs` にコピー

#### @truto/turndown-plugin-gfm ^1.0.2

**用途**: Turndown の GFM（GitHub Flavored Markdown）プラグイン。テーブル変換をサポート。

**使用箇所**:
- `src/content-scripts/selection-to-markdown.ts` - GFM テーブル変換

**ビルド時の処理**:
- `scripts/postinstall.js` で `src/vendor/turndown-plugin-gfm.mjs` にコピー

#### bulma ^1.0.0

**用途**: CSS フレームワーク。拡張機能の UI スタイリング。

**使用箇所**:
- `src/static/popup.html` - ポップアップ UI
- `src/static/options.html` - オプションページ
- `src/static/about.html` - About ページ
- その他すべての HTML ページ

**ビルド時の処理**:
- `scripts/postinstall.js` で `src/vendor/bulma.css` にコピー

#### webextension-polyfill ^0.12.0

**用途**: WebExtensions API ポリフィル。Chrome と Firefox の API 差異を吸収。

**使用箇所**:
- Firefox MV2 ビルドでのみ使用
- `browser.*` API を Chrome の `chrome.*` API に統一

**ビルド時の処理**:
- `scripts/postinstall.js` で `src/vendor/browser-polyfill.js` にコピー

---

## ビルドフロー図

```
npm install
    │
    ▼
postinstall.js ─────────────────────────────────────┐
    │                                               │
    ▼                                               ▼
node_modules/                              src/vendor/
├── mustache/                              ├── mustache.mjs
├── turndown/                              ├── turndown.mjs
├── @truto/turndown-plugin-gfm/            ├── turndown-plugin-gfm.mjs
├── bulma/                                 ├── bulma.css
└── webextension-polyfill/                 ├── browser-polyfill.js
                                           └── browser-polyfill.js.map
    │
    ▼
npm run compile
    │
    ▼
tsc (TypeScript コンパイル)
    │
    ▼
scripts/compile.js (プラットフォーム別ビルド)
    │
    ├──► chrome/dist/
    ├──► firefox-mv2/dist/
    └──► firefox-mv3/dist/
```

---

## 依存関係の更新指針

| パッケージ種別 | 更新頻度 | 注意点 |
|---------------|---------|--------|
| 型定義 | 低 | Chrome/Firefox API 変更時のみ |
| ビルドツール | 中 | 破壊的変更に注意 |
| テストツール | 中 | Vitest/Playwright のメジャー更新に注意 |
| ランタイムライブラリ | 低 | バンドルサイズへの影響を確認 |

---

*最終更新: 2025-12-27*