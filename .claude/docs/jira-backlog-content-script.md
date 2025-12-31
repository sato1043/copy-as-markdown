# JIRA Backlog Content Script

このドキュメントはJIRAバックログページでのコンテンツスクリプト機能を説明する。

## 概要

| 項目 | 内容 |
|------|------|
| 対象URL | `*://*.atlassian.net/jira/*` |
| スクリプト | `dist/content-scripts/jira-backlog.js` |

### 機能一覧

| 機能名 | 設定キー | 動作 | デフォルト |
|--------|---------|------|-----------|
| Backlog Open in New Window | `jiraBacklogOpenDetailInNewWindow` | バックログの課題カードクリックで新しいウィンドウを開く | 無効 |
| Timeline Open in New Window | `jiraTimelineOpenDetailInNewWindow` | タイムラインの課題行クリックで新しいウィンドウを開く | 無効 |
| Hide Create Button | `jiraBacklogHideCreateButton` | バックログのインライン「作成」ボタンを非表示 | 無効 |
| Hidden Tabs | `jiraSpaceNavHiddenTabs` | スペースナビゲーションの指定タブを非表示 | 空配列（全表示） |

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
                ├── [Backlog Open in New Window 機能]
                │   isOpenInNewWindowEnabled()
                │       │
                │       ▼
                │   browser.storage.sync.get()
                │       │
                │       ├── false → スキップ
                │       └── true  → attachClickListener() + observeDynamicContent()
                │
                ├── [Timeline Open in New Window 機能]
                │   isTimelineOpenInNewWindowEnabled()
                │       │
                │       ▼
                │   browser.storage.sync.get()
                │       │
                │       ├── false → スキップ
                │       └── true  → attachTimelineClickListener() + observeDynamicContent()
                │
                ├── [Hide Create Button 機能]
                │   isHideCreateButtonEnabled()
                │       │
                │       ▼
                │   browser.storage.sync.get()
                │       │
                │       ├── false → removeHideCreateButtonStyle()
                │       └── true  → injectHideCreateButtonStyle()
                │
                └── [Hidden Tabs 機能]
                    getHiddenTabs()
                        │
                        ▼
                    browser.storage.sync.get()
                        │
                        └── injectHideTabsStyle(hiddenTabs)

    [Open in New Window] ユーザーがバックログ課題カードをクリック
        │
        ▼
    handleCardClick(event)
        │
        ├── target.closest(CARD_SELECTOR) → null → リターン
        ├── findIssueUrl(card) → null → リターン
        ├── event.preventDefault() + stopPropagation()
        └── window.open(issueUrl, '_blank')

    [Hide Create Button] CSS注入による非表示
        │
        ▼
    injectHideCreateButtonStyle()
        │
        └── <style> 要素を document.head に追加
            CREATE_BUTTON_SELECTOR { display: none !important; }
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

**ファイル**: `src/content-scripts/jira-backlog.ts:10-23`

```typescript
// Backlog selectors
const CARD_SELECTOR = '[data-testid="software-backlog.card-list.card.card-contents.interaction-layer.accessible-card"]';
const ISSUE_LINK_SELECTOR = '[data-testid="software-backlog.card-list.card.card-contents.screen-reader-key"]';
const CREATE_BUTTON_SELECTOR = '[data-testid="software-backlog.card-list.inline-work-item-create.trigger-wrapper"]';

// Timeline selectors
const TIMELINE_ROW_SELECTOR = '[data-testid^="roadmap.timeline-table.components.list-item.container-"]';
const TIMELINE_LINK_SELECTOR = '[data-testid="roadmap.timeline-table-kit.ui.list-item-content.summary.key"]';

// Setting keys
const SETTING_KEY = 'jiraBacklogOpenDetailInNewWindow';
const TIMELINE_SETTING_KEY = 'jiraTimelineOpenDetailInNewWindow';
const HIDE_CREATE_SETTING_KEY = 'jiraBacklogHideCreateButton';
```

| セレクタ/キー | 対象 |
|--------------|------|
| `CARD_SELECTOR` | バックログのクリック可能な課題カード |
| `ISSUE_LINK_SELECTOR` | バックログのスクリーンリーダー用リンク要素 |
| `CREATE_BUTTON_SELECTOR` | インライン「作成」ボタンのラッパー要素 |
| `TIMELINE_ROW_SELECTOR` | タイムラインの課題行（data-testid前方一致） |
| `TIMELINE_LINK_SELECTOR` | タイムラインの課題リンク要素 |

### 2. 設定読み込み

**ファイル**: `src/content-scripts/jira-backlog.ts:16-26`

```typescript
async function isOpenInNewWindowEnabled(): Promise<boolean> {
  try {
    const result = await browser.storage.sync.get({ [SETTING_KEY]: false });
    return result[SETTING_KEY] as boolean;
  } catch (error) {
    console.error('[Copy as Markdown] Failed to read open in new window setting:', error);
    return false;
  }
}
```

**動作**:
- `browser.storage.sync.get()` で設定を取得
- デフォルト値は `false`（無効）
- エラー時も `false` を返す（安全側に倒す）
- `isHideCreateButtonEnabled()` も同様のパターンで実装

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
const SKJiraTimelineOpenDetailInNewWindow = 'jiraTimelineOpenDetailInNewWindow';
const SKJiraBacklogHideCreateButton = 'jiraBacklogHideCreateButton';
const SKJiraSpaceNavHiddenTabs = 'jiraSpaceNavHiddenTabs';
```

### オプションページ

**ファイル**: `src/static/options-jira.html`

| 設定項目 | 設定キー | 説明 |
|---------|---------|------|
| Backlog Issue Behavior | `jiraBacklogOpenDetailInNewWindow` | バックログ課題カードクリックで新ウィンドウを開く |
| Timeline Issue Behavior | `jiraTimelineOpenDetailInNewWindow` | タイムライン課題行クリックで新ウィンドウを開く |
| Hide "Create" button | `jiraBacklogHideCreateButton` | インライン作成ボタンを非表示 |
| Space Navigation Hidden Tabs | `jiraSpaceNavHiddenTabs` | チェックしたタブを非表示（複数選択可） |

**ナビゲーション**:
- 全オプションページのメニューに「JIRA」リンクを追加
- `options-jira.html` へ遷移可能

### Hide Create Button の実装詳細

**CSS注入方式を採用した理由**:
- 動的に追加される要素にも自動的に適用される
- `display: none !important` でJIRAのスタイルを確実に上書き
- ページリロードなしで即座に反映可能

```typescript
const HIDE_CREATE_BUTTON_STYLE_ID = 'copy-as-markdown-hide-create-button';

function injectHideCreateButtonStyle(): void {
  if (document.getElementById(HIDE_CREATE_BUTTON_STYLE_ID)) {
    return; // 重複注入を防止
  }

  const style = document.createElement('style');
  style.id = HIDE_CREATE_BUTTON_STYLE_ID;
  style.textContent = `${CREATE_BUTTON_SELECTOR} { display: none !important; }`;
  document.head.appendChild(style);
}

function removeHideCreateButtonStyle(): void {
  const style = document.getElementById(HIDE_CREATE_BUTTON_STYLE_ID);
  if (style) {
    style.remove();
  }
}
```

**設定変更時の動作**:
- `jiraBacklogHideCreateButton`: 即座にスタイルを注入/削除（リロード不要）
- `jiraBacklogOpenDetailInNewWindow`: ページをリロード（リスナー管理の簡略化のため）

### Hidden Tabs の実装詳細

**対象タブ一覧**:

| パス | 日本語名 | セレクタ方式 |
|-----|---------|-------------|
| summary | 要約 | href |
| timeline | タイムライン | href |
| backlog | バックログ | href |
| boards | ボード | href（特殊処理） |
| calendar | カレンダー | href |
| list | リスト | href |
| form | フォーム | href |
| development | 開発 | href |
| code | コード | href |
| archived-work-items | アーカイブ済みの作業項目 | href |
| pages | ページ | href |
| shortcuts | ショートカット | data-testid |
| addtabs | タブを追加 | data-testid |

**CSS生成ロジック**:

```typescript
const cssRules = hiddenTabs.map((tabPath) => {
  // shortcuts と addtabs は button 要素のため data-testid で判定
  if (tabPath === 'shortcuts') {
    return `nav[aria-label="スペース ナビゲーション"] li:has([data-testid="horizontal-nav-shortcuts-tab.dropdown-menu-trigger"]) { display: none !important; }`;
  }
  if (tabPath === 'addtabs') {
    return `nav[aria-label="スペース ナビゲーション"] [data-testid="navigation-kit-add-tab.ui.trigger"] { display: none !important; }`;
  }
  // boards は /boards/N 形式だが、backlog/timeline/calendar は /boards/N/xxx のため除外
  if (tabPath === 'boards') {
    return `nav[aria-label="スペース ナビゲーション"] li:has(a[href*="/boards/"]):not(:has(a[href$="/backlog"])):not(:has(a[href$="/timeline"])):not(:has(a[href$="/calendar"])) { display: none !important; }`;
  }
  // その他は href 末尾一致で判定
  return `nav[aria-label="スペース ナビゲーション"] li:has(a[href$="/${tabPath}"]) { display: none !important; }`;
}).join('\n');
```

**特殊ケース**:
- `shortcuts`: `<button>` 要素のため `data-testid` で判定
- `addtabs`: `<button>` 要素のため `data-testid` で判定
- `boards`: URL が `/boards/N` だが、`backlog`/`timeline`/`calendar` は `/boards/N/xxx` のため除外処理が必要

**設定変更時の動作**:
- `jiraSpaceNavHiddenTabs`: 即座にスタイルを再注入（リロード不要）

## テスト

### E2Eテスト

**ファイル**: `test/e2e/jira-backlog.spec.ts`

**Backlog Open in New Window テスト**:

| テストケース | 検証内容 |
|-------------|---------|
| `setting is stored correctly` | 設定値が正しく保存される |
| `fixture page has correct DOM structure` | フィクスチャDOMが期待通り |
| `content script opens new window on card click` | カードクリックで新ウィンドウが開く |
| `aria-label fallback extracts issue key` | aria-labelからの課題キー抽出 |
| `content script does not activate when disabled` | 無効時は動作しない |

**Timeline Open in New Window テスト**:

| テストケース | 検証内容 |
|-------------|---------|
| `timeline setting is stored correctly` | タイムライン設定値が正しく保存される |
| `fixture page has timeline DOM structure` | タイムラインフィクスチャDOMが期待通り |
| `content script opens new window on timeline row click` | タイムライン行クリックで新ウィンドウが開く |
| `content script does not activate when timeline setting is false` | 無効時は動作しない |

**Hide Create Button テスト**:

| テストケース | 検証内容 |
|-------------|---------|
| `hides create button when enabled` | 有効時にCreateボタンが非表示 |
| `shows create button when disabled` | 無効時にCreateボタンが表示 |

**Hidden Tabs テスト**:

| テストケース | 検証内容 |
|-------------|---------|
| `hides tabs with href-based selector` | href ベースのタブが非表示 |
| `hides shortcuts tab with data-testid selector` | shortcuts タブが非表示 |
| `hides addtabs button with data-testid selector` | addtabs ボタンが非表示 |
| `hides boards tab without hiding backlog/timeline/calendar` | boards のみ非表示（他は表示） |
| `shows all tabs when hiddenTabs is empty` | 空配列時は全タブ表示 |

### フィクスチャ

**ファイル**: `fixtures/jira-backlog.html`

JIRAバックログページのDOM構造を模倣したHTMLフィクスチャ。

---

*最終更新: 2025-12-31*