# JIRA Backlog Content Script

このドキュメントはJIRAバックログページでのコンテンツスクリプト機能を説明する。

## 概要

| 項目 | 内容 |
|------|------|
| 機能名 | JIRA Backlog Open in New Window |
| 設定キー | `jiraBacklogOpenDetailInNewWindow` |
| 対象URL | `*://*.atlassian.net/jira/*` |
| 動作 | バックログの課題カードクリックで新しいウィンドウを開く |
| デフォルト | 無効（`false`） |

## 処理フロー

```
    ページ読み込み
        │
        ▼
    content_scripts によりスクリプト注入
        │
        ├── browser-polyfill.js（先に読み込み）
        │
        └── jira-backlog.js
                │
                ▼
            init()
                │
                ├── isFeatureEnabled()
                │       │
                │       ▼
                │   browser.storage.sync.get()
                │       │
                │       └── false → 早期リターン（機能無効）
                │       └── true  → 続行
                │
                ├── attachClickListener()
                │       │
                │       ▼
                │   document.addEventListener('click', handleCardClick, { capture: true })
                │
                └── observeDynamicContent()
                        │
                        ▼
                    MutationObserver（将来の拡張用）

    ユーザー
        │
        │ バックログ課題カードをクリック
        ▼
    handleCardClick(event)
        │
        ├── target.closest(CARD_SELECTOR)
        │       │
        │       └── null → リターン（カード外クリック）
        │
        ├── findIssueUrl(card)
        │       │
        │       ├── ISSUE_LINK_SELECTOR でリンク要素を検索
        │       │       │
        │       │       └── link.href があれば返す
        │       │
        │       └── フォールバック: aria-label から課題キーを抽出
        │               │
        │               └── /^([A-Z]+-\d+)/ にマッチ → `/browse/${match[1]}`
        │
        ├── event.preventDefault()
        ├── event.stopPropagation()
        │
        └── window.open(issueUrl, '_blank')
                │
                ▼
            新しいウィンドウで課題ページを開く
```

## 関連ファイル

| ファイル | 役割 |
|---------|------|
| `src/content-scripts/jira-backlog.ts` | コンテンツスクリプト本体 |
| `src/lib/settings.ts` | 設定キー定義とアクセサ |
| `src/static/options-jira.html` | JIRAオプションページUI |
| `src/ui/options-jira.ts` | オプションページのロジック |
| `chrome/manifest.json` | Chrome向けマニフェスト（content_scripts定義） |
| `firefox-mv3/manifest.json` | Firefox MV3向けマニフェスト |
| `firefox-mv2/manifest.json` | Firefox MV2向けマニフェスト |
| `scripts/compile.js` | ビルド時のESM export削除処理 |
| `fixtures/jira-backlog.html` | E2Eテスト用フィクスチャ |
| `test/e2e/jira-backlog.spec.ts` | E2Eテスト |

## マニフェスト設定

### Chrome / Firefox MV3

```json
"host_permissions": [
  "*://*.atlassian.net/*"
],
"content_scripts": [
  {
    "matches": ["*://*.atlassian.net/jira/*"],
    "js": [
      "dist/vendor/browser-polyfill.js",
      "dist/content-scripts/jira-backlog.js"
    ],
    "run_at": "document_end"
  }
]
```

### Firefox MV2

```json
"permissions": [
  // ... 既存の権限
  "*://*.atlassian.net/*"
],
"content_scripts": [
  {
    "matches": ["*://*.atlassian.net/jira/*"],
    "js": [
      "dist/vendor/browser-polyfill.js",
      "dist/content-scripts/jira-backlog.js"
    ],
    "run_at": "document_end"
  }
]
```

**MV2とMV3の違い**:
- MV3: `host_permissions` で別途ホスト権限を宣言
- MV2: `permissions` 配列にホストパターンを追加

## コード詳細

### 1. セレクタ定義

**ファイル**: `src/content-scripts/jira-backlog.ts:10-12`

```typescript
const CARD_SELECTOR = '[data-testid="software-backlog.card-list.card.card-contents.interaction-layer.accessible-card"]';
const ISSUE_LINK_SELECTOR = '[data-testid="software-backlog.card-list.card.card-contents.screen-reader-key"]';
const SETTING_KEY = 'jiraBacklogOpenDetailInNewWindow';
```

| セレクタ | 対象要素 |
|---------|---------|
| `CARD_SELECTOR` | クリック可能な課題カード（アクセシビリティ用） |
| `ISSUE_LINK_SELECTOR` | スクリーンリーダー用の課題リンク要素 |

### 2. 設定読み込み

**ファイル**: `src/content-scripts/jira-backlog.ts:14-24`

```typescript
async function isFeatureEnabled(): Promise<boolean> {
  try {
    const result = await browser.storage.sync.get({ [SETTING_KEY]: false });
    return result[SETTING_KEY] as boolean;
  } catch (error) {
    console.error('[Copy as Markdown] Failed to read settings:', error);
    return false;
  }
}
```

**動作**:
- `browser.storage.sync.get()` で設定を取得
- デフォルト値は `false`（無効）
- エラー時も `false` を返す（安全側に倒す）

### 3. 課題URL抽出

**ファイル**: `src/content-scripts/jira-backlog.ts:26-49`

```typescript
function findIssueUrl(card: Element): string | null {
  // 1. リンク要素から直接取得
  const container = card.closest('[data-testid*="software-backlog.card-list.card"]');
  const link = container?.querySelector(ISSUE_LINK_SELECTOR) as HTMLAnchorElement | null;
  if (link?.href) {
    return link.href;
  }

  // 2. aria-labelからフォールバック抽出
  const ariaLabel = card.getAttribute('aria-label');
  if (ariaLabel) {
    const match = ariaLabel.match(/^([A-Z]+-\d+)/);
    if (match) {
      return `/browse/${match[1]}`;
    }
  }

  return null;
}
```

**抽出戦略**:
1. **優先**: `ISSUE_LINK_SELECTOR` に一致するリンク要素の `href` 属性
2. **フォールバック**: `aria-label` 属性から課題キー（例: `SCRUM-1`）を正規表現で抽出

### 4. クリックハンドラ

**ファイル**: `src/content-scripts/jira-backlog.ts:51-76`

```typescript
function handleCardClick(event: MouseEvent): void {
  const target = event.target as Element;
  const card = target.closest(CARD_SELECTOR);

  if (!card) {
    return;  // カード外クリックは無視
  }

  const issueUrl = findIssueUrl(card);
  if (!issueUrl) {
    return;  // URL取得失敗は無視
  }

  event.preventDefault();
  event.stopPropagation();

  window.open(issueUrl, '_blank');
}
```

**ポイント**:
- `capture: true` でイベントをキャプチャフェーズで捕捉
- JIRAのデフォルトハンドラより先に実行される
- `preventDefault()` と `stopPropagation()` でデフォルト動作を抑止

### 5. 設定変更の監視

**ファイル**: `src/content-scripts/jira-backlog.ts:111-118`

```typescript
browser.storage.sync.onChanged.addListener((changes) => {
  if (SETTING_KEY in changes) {
    window.location.reload();
  }
});
```

**動作**:
- オプションページで設定が変更されるとページをリロード
- リスナーの状態管理を簡略化するための設計判断

## ビルド時の処理

### ESM export 削除

**ファイル**: `scripts/compile.js:13-27`

```javascript
const contentScriptsDir = path.join(destination, 'dist', 'content-scripts');
if (fs.existsSync(contentScriptsDir)) {
  const files = fs.readdirSync(contentScriptsDir);
  for (const file of files) {
    if (file.endsWith('.js')) {
      const filePath = path.join(contentScriptsDir, file);
      let content = fs.readFileSync(filePath, 'utf-8');
      content = content.replace(/\nexport\s*\{\s*\};\s*$/, '\n');
      fs.writeFileSync(filePath, content, 'utf-8');
    }
  }
}
```

**背景**:
- TypeScript は `module: "NodeNext"` 設定でインポート/エクスポートのないファイルに `export {};` を追加
- ブラウザ拡張機能のコンテンツスクリプトは ESM 形式をサポートしない
- ビルド後処理で `export {};` を削除して互換性を確保

## 設定

### 設定キー

**ファイル**: `src/lib/settings.ts`

```typescript
const SKJiraBacklogOpenDetailInNewWindow = 'jiraBacklogOpenDetailInNewWindow';
```

### オプションページ

**ファイル**: `src/static/options-jira.html`

チェックボックスで機能の有効/無効を切り替え。

**ナビゲーション**:
- 全オプションページのメニューに「JIRA」リンクを追加
- `options-jira.html` へ遷移可能

## テスト

### E2Eテスト

**ファイル**: `test/e2e/jira-backlog.spec.ts`

| テストケース | 検証内容 |
|-------------|---------|
| `setting is stored correctly` | 設定値が正しく保存される |
| `fixture page has correct DOM structure` | フィクスチャDOMが期待通り |
| `content script opens new window on card click` | カードクリックで新ウィンドウが開く |
| `aria-label fallback extracts issue key` | aria-labelからの課題キー抽出 |
| `content script does not activate when disabled` | 無効時は動作しない |

### フィクスチャ

**ファイル**: `fixtures/jira-backlog.html`

JIRAバックログページのDOM構造を模倣したHTMLフィクスチャ。

---

*最終更新: 2025-12-31*