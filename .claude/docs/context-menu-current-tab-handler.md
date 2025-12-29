# Context Menu: Current Tab (Markdown Link) ハンドラー

このドキュメントは「Current Tab (Markdown Link)」コンテキストメニューの処理フローを説明する。

## 概要

| 項目        | 内容                                                  |
|-------------|-------------------------------------------------------|
| メニューID  | `current-tab`                                         |
| 機能        | 現在のタブのタイトルとURLをMarkdownリンク形式でコピー |
| 出力形式    | `[タイトル](URL)`                                     |

## 処理フロー

```
    ユーザー
        │
        │ 右クリック → "Copy as Markdown" → "Current Tab (Markdown Link)"
        ▼
    browser.contextMenus.onClicked
        │
        ▼
    context-menu-handler.ts
        ├── createContextMenuHandler()
        │   └── handleMenuClick_()
        │       │
        │       │ menuItemId === 'current-tab' を判定
        │       ▼
        │       linkExportService.exportLink({
        │         format: 'link',
        │         title: tab.title,
        │         url: tab.url
        │       })
        │
        ▼
    link-export-service.ts
        ├── LinkExportService.exportLink()
        │   │
        │   │ format === 'link' の場合
        │   ▼
        │   markdown.linkTo(title, url)
        │
        ▼
    markdown.ts
        ├── Markdown.linkTo()
        │   │
        │   │ タイトルのエスケープ処理
        │   │ Markdownリンク形式に整形
        │   ▼
        │   "[escaped_title](url)" を返す
        │
        ▼
    clipboard-service.ts
        ├── ClipboardService.write()
        │   │
        │   ▼
        │   クリップボードに書き込み
```

## 関連ファイル

| ファイル | 役割 |
|---------|------|
| `src/background.ts:22,31,58-62,68` | サービス初期化とDI（依存性注入） |
| `src/contracts/commands.ts:27` | `ContextMenuIds.CurrentTab = 'current-tab'` の定義 |
| `src/handlers/context-menu-handler.ts:85-94` | メニュークリック時のハンドラー |
| `src/services/link-export-service.ts:54-78` | `exportLink()` メソッド |
| `src/lib/markdown.ts` | `Markdown.linkTo()` でリンク形式に変換 |
| `src/services/context-menu-service.ts` | メニュー登録処理 |

## コード詳細

### 0. サービス初期化とDI（依存性注入）

**ファイル**: `src/background.ts`

Service Worker起動時に各サービスが初期化され、ハンドラーに注入される:

```typescript
// 行22: Markdownインスタンスの生成（Markdown変換の中核）
const markdownInstance = new Markdown();

// 行29: contextMenuServiceの生成（メニュー登録を担当）
const contextMenuService = createBrowserContextMenuService(CustomFormatsStorage, BuiltInStyleSettings);

// 行31: LinkExportServiceのインスタンス化（markdownInstanceを注入）
const linkExportService = new LinkExportService(markdownInstance, CustomFormatsStorage);

// 行58-62: handlerServicesオブジェクトにサービスを登録
const handlerServices = {
  linkExportService,
  tabExportService,
  selectionConverterService,
};

// 行68-71: contextMenuHandlerの生成時にhandlerServicesを注入
const contextMenuHandler = createBrowserContextMenuHandler(
  handlerServices,
  bookmarks,
);

// 行101: メニュー登録の実行
contextMenuService.createAll();
```

**DIフロー**:
```
background.ts
    │
    ├── new Markdown()  ← 行22
    │       │
    │       ▼
    ├── new LinkExportService(markdownInstance, storage)  ← 行31
    │       │
    │       ▼
    ├── handlerServices = { linkExportService, ... }  ← 行58-62
    │       │
    │       ▼
    └── createBrowserContextMenuHandler(handlerServices, ...)  ← 行68
            │
            ▼
        context-menu-handler.ts
            └── services.linkExportService.exportLink()
                    │
                    ▼
                markdown.linkTo(title, url)
```

`markdownInstance`は`src/lib/markdown.ts`の`Markdown`クラスのインスタンスである。
`LinkExportService`に注入され、`linkTo()`メソッドでMarkdownリンク形式への変換を行う。

#### メニュー登録

**ファイル**: `src/services/context-menu-service.ts`

`createBasicMenus()`は`contextMenuService.createAll()`から呼ばれる。

**`createAll()`の呼び出しタイミング** (`src/background.ts`):

| 行   | タイミング                         | 説明                                   |
|------|-----------------------------------|----------------------------------------|
| 101  | Service Worker起動時              | 初期メニュー作成                       |
| 97   | アラーム発火時                    | `ALARM_REFRESH_MENU`でメニュー再作成   |
| 108  | ストレージ変更時                  | カスタムフォーマット/スタイル設定変更時 |

`createBasicMenus()`関数内でコンテキストメニューが登録される:

```typescript
browser.contextMenus.create({
  id: ContextMenuIds.CurrentTab,
  title: browser.i18n.getMessage('contextMenuItemCurrentTab'),
  contexts: ['page'],
});
```

| 項目             | 値                               |
|------------------|----------------------------------|
| ID               | `current-tab`                    |
| 表示コンテキスト | `page`（ページ上で右クリック時） |
| 表示テキスト     | ローカライズされたメニュー名     |

### 1. コマンドID定義

**ファイル**: `src/contracts/commands.ts:27`

```typescript
ContextMenuIds = {
  CurrentTab: 'current-tab',
  // ...
} as const;
```

### 2. ハンドラー

**ファイル**: `src/handlers/context-menu-handler.ts:85-94`

```typescript
if (menuItemId === ContextMenuIds.CurrentTab) {
  if (!tab) {
    throw new Error('tab is required for current-tab menu item');
  }
  return services.linkExportService.exportLink({
    format: 'link',
    title: tab.title || '',
    url: tab.url || '',
  });
}
```

**処理内容**:
1. `menuItemId`が`'current-tab'`か判定
2. `tab`オブジェクトの存在を確認（必須）
3. `linkExportService.exportLink()`を呼び出し

### 3. エクスポートサービス

**ファイル**: `src/services/link-export-service.ts:54-78`

```typescript
async exportLink(options: LinkExportOptions): Promise<string> {
  validateLinkExportOptions(options);

  switch (options.format) {
    case 'link':
      return this.markdown.linkTo(options.title, options.url);

    case 'custom-format':
      return renderCustomFormatLink(/* ... */);

    default:
      throw new TypeError(`invalid format: ${options.format}`);
  }
}
```

**処理内容**:
1. オプションのバリデーション
2. `format`に応じて分岐
3. `'link'`の場合は`markdown.linkTo()`を呼び出し

### 4. Markdown変換

**ファイル**: `src/lib/markdown.ts:120-138`

`Markdown.linkTo(title, url)`メソッドが以下を行う:
1. タイトルが空の場合は`(No Title)`を使用
2. **タイトル末尾サフィックス削除**: 最後の` - xxx`パターンを除去（オプション）
3. **ブラケットプレフィックス抽出**: タイトルが`[xxx]`で始まる場合、その部分をリンクテキストとして抽出し、残りをプレーンテキストとして追加（オプション）
4. タイトル内の特殊文字をエスケープ（`[`, `]`など）
5. `[title](url)`形式の文字列を生成

**処理順序**: サフィックス削除 → ブラケットプレフィックス抽出 → エスケープ → リンク生成

#### ブラケットプレフィックス抽出機能

**ファイル**: `src/lib/markdown.ts:125-135`

```typescript
if (this.extractBracketedPrefix) {
  // 先頭の [xxx] パターンを抽出し、残りをテキストとして追加
  // 例: [JIRA-1234] Some Feature Title → [JIRA-1234](url) Some Feature Title
  const pattern = /^\[([^\]]+)\]\s*(.*)/;
  const match = title.match(pattern);
  if (match && match[1]) {
    const prefixText = this.escapeLinkText(match[1]);
    const remainder = match[2] ? ` ${match[2]}` : '';
    return `[${prefixText}](${url})${remainder}`;
  }
}
```

**動作例** (`extractBracketedPrefix=true`の場合):

| ページタイトル | 出力 |
|---------------|------|
| `[JIRA-1234] Some Title` | `[JIRA-1234](url) Some Title` |
| `[PROJ-999] Fix bug` | `[PROJ-999](url) Fix bug` |
| `[TICKET-1]` | `[TICKET-1](url)` |
| `[ABC] Simple` | `[ABC](url) Simple` |
| `Some Title` | `[Some Title](url)` |
| `Not [JIRA-1234] Title` | `[Not [JIRA-1234] Title](url)` |
| `[PROJ-1] [JIRA-2] Title` | `[PROJ-1](url) [JIRA-2] Title` |

**設定**:
- オプションページ: 「Bracketed Prefix Extraction」チェックボックス
- 設定キー: `extractBracketedPrefix`（デフォルト: `false`）
- 任意のプレフィックス形式に対応（`JIRA-`, `PROJ-`, `TICKET-`など）

**関連ファイル**:
- 設定: `src/lib/settings.ts` - `SKExtractBracketedPrefix`
- UI: `src/static/options.html` - `form-extract-bracketed-prefix`
- テスト: `test/markdown.test.ts` の `extractBracketedPrefix` セクション

#### タイトル末尾サフィックス削除機能

**ファイル**: `src/lib/markdown.ts:128-136`

```typescript
if (this.trimTitleTrailingSuffix) {
  // 最後の " - xxx" パターンを除去
  // 例: "記事タイトル - サイト名" → "記事タイトル"
  processedTitle = title.replace(/\s+-\s[^-]*$/, '').trim();
  if (processedTitle === '') {
    return `[${Markdown.DefaultTitle()}](${url})`;
  }
}
```

**動作例** (`trimTitleTrailingSuffix=true`の場合):

| ページタイトル | 出力 |
|---------------|------|
| `Article Title - Site Name` | `[Article Title](url)` |
| `A - B - C` | `[A - B](url)` |
| `Simple Title` | `[Simple Title](url)` |
| `Title-Suffix` | `[Title-Suffix](url)` |

**両オプション併用時の動作例** (`trimTitleTrailingSuffix=true`, `extractBracketedPrefix=true`):

| ページタイトル | 出力 |
|---------------|------|
| `[JIRA-1234] Some Title - Jira` | `[JIRA-1234](url) Some Title` |
| `[PROJ-999] Feature - Site` | `[PROJ-999](url) Feature` |

**設定**:
- オプションページ: 「Title Trailing Suffix Removal」チェックボックス
- 設定キー: `trimTitleTrailingSuffix`（デフォルト: `false`）
- パターン: `\s+-\s[^-]*$`（最後の` - xxx`にマッチ）

**関連ファイル**:
- 設定: `src/lib/settings.ts` - `SKTrimTitleTrailingSuffix`
- UI: `src/static/options.html` - `form-trim-title-trailing-suffix`
- テスト: `test/markdown.test.ts` の `trimTitleTrailingSuffix` セクション

## 関連するキーボードショートカット

`KeyboardCommandIds.CurrentTabLink`が同等の機能を提供する。

**ファイル**: `src/handlers/keyboard-command-handler.ts`

---

*最終更新: 2025-12-29*
