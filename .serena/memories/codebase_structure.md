# Codebase Structure

## Root Directory
```
copy-as-markdown/
├── src/                  # ソースコード
├── dist/                 # TypeScriptコンパイル出力
├── chrome/               # Chrome用マニフェスト + dist/
├── firefox-mv2/          # Firefox MV2用マニフェスト + dist/
├── firefox-mv3/          # Firefox MV3用マニフェスト + dist/
├── test/                 # テストコード
├── scripts/              # ビルドスクリプト
├── fixtures/             # テスト用HTMLファイル
├── build/                # 配布用パッケージ出力
└── docker/               # Docker設定
```

## Source Structure (`src/`)
```
src/
├── background.ts                    # Service Worker エントリーポイント
├── content-script.ts                # Content Script
├── bookmarks.ts                     # ブックマーク機能
├── iframe-copy.ts                   # iframe内コピー処理
│
├── handlers/                        # ユーザーアクションハンドラ
│   ├── context-menu-handler.ts      # 右クリックメニュー
│   ├── keyboard-command-handler.ts  # キーボードショートカット
│   └── runtime-message-handler.ts   # メッセージパッシング
│
├── services/                        # コアロジック（ブラウザアダプタ付き）
│   ├── tab-export-service.ts        # タブをMarkdownとしてエクスポート
│   ├── link-export-service.ts       # リンクをエクスポート
│   ├── selection-converter-service.ts # HTML→Markdown変換
│   ├── clipboard-service.ts         # クリップボード操作
│   ├── context-menu-service.ts      # メニュー登録
│   ├── badge-service.ts             # バッジ表示
│   ├── browser-tab-data-fetcher.ts  # タブデータ取得
│   ├── browser-utils.ts             # ブラウザユーティリティ
│   └── shared-types.ts              # 共有型定義
│
├── lib/                             # ユーティリティ
│   ├── markdown.ts                  # Markdownフォーマット
│   ├── custom-format.ts             # Mustacheテンプレート
│   ├── settings.ts                  # 設定管理
│   ├── built-in-style-settings.ts   # 組み込みスタイル設定
│   └── tabs.ts                      # タブユーティリティ
│
├── ui/                              # ポップアップ/オプションページ
│   ├── popup.ts
│   ├── options.ts
│   ├── custom-format.ts
│   └── permissions*.ts
│
├── contracts/                       # 型定義
│   ├── commands.ts                  # コマンド定義
│   └── messages.ts                  # メッセージ定義
│
├── storage/                         # ストレージ
│   └── custom-formats-storage.ts
│
├── config/                          # 設定
│   └── flags.ts
│
├── static/                          # 静的ファイル（HTML, CSS, 画像）
│   ├── *.html
│   ├── style.css
│   └── images/
│
└── vendor/                          # バンドル済みライブラリ
    ├── turndown.mjs
    ├── mustache.mjs
    └── browser-polyfill.js
```

## Test Structure (`test/`)
```
test/
├── *.test.ts             # ユニットテスト（vitest）
├── handlers/             # ハンドラテスト
├── services/             # サービステスト
├── ui/                   # ブラウザテスト（vitest browser mode）
└── e2e/                  # E2Eテスト（Playwright）
```

### テスト環境の注意点
- E2Eテストは拡張機能のサイドローディングをサポートするため、Chromium チャンネル（Chrome ではなく）を使用
- 手動QA: 拡張機能をロードした状態でブラウザで `fixtures/qa.html` を開く

## Message Flow
1. ユーザーがアクションをトリガー（コンテキストメニュー、キーボード、ポップアップ）
2. ハンドラがイベントを受け取り、適切なサービスに委譲
3. サービスが処理を行い、Markdownテキストを返す
4. ClipboardServiceがクリップボードにコピー
