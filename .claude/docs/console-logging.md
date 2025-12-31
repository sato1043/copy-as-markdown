# Console Logging（デバッグ用ログ出力）

このドキュメントはブラウザ拡張機能のデバッグ時およびE2Eテスト時のconsole.log出力確認方法を説明する。

## 概要

| 用途                 | ツール                             | 出力形式                          |
|----------------------|------------------------------------|-----------------------------------|
| リアルタイムデバッグ | `scripts/chrome-console-logger.js` | `[PAGE log] ...` / `[SW log] ...` |
| E2Eテスト            | `test/e2e/fixtures.ts`             | `[PAGE log] ...` / `[SW log] ...` |

## 1. リアルタイムデバッグ

### 概要

Chrome DevTools Protocol (CDP) を使用してリモートデバッグ中のChromeからconsole出力をリアルタイムで取得する。

### ファイル

```
scripts/chrome-console-logger.js
```

### 使い方

```bash
# ターミナル1: Chromeをリモートデバッグモードで起動
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-debug \
  --load-extension=$(pwd)/chrome

# ターミナル2: ログ監視スクリプトを実行
node scripts/chrome-console-logger.js
```

### 環境変数

| 変数名     | デフォルト | 説明                                 |
|------------|------------|--------------------------------------|
| `CDP_PORT` | `9222`     | Chrome DevTools Protocolのポート番号 |

### 出力形式

```
[接続] [PAGE] ページタイトル
[PAGE log] 10:30:45 ログメッセージ
[PAGE warn] 10:30:46 警告メッセージ
[PAGE error] 10:30:47 エラーメッセージ
[SW log] 10:30:48 Service Workerからのログ
[切断] [PAGE] ページタイトル
```

### 色分け

| タイプ | 色         |
|--------|------------|
| log    | デフォルト |
| info   | シアン     |
| warn   | 黄色       |
| error  | 赤         |
| debug  | グレー     |

### 仕組み

```
┌─────────────────┐
│ Chrome          │
│ (デバッグモード) │
│ port: 9222      │
└────────┬────────┘
         │ WebSocket
         ▼
┌─────────────────┐
│ chrome-console  │
│ -logger.js      │
│                 │
│ 1. /json で     │
│    ターゲット取得│
│ 2. WebSocket接続│
│ 3. Runtime.enable│
│ 4. consoleAPI   │
│    イベント監視 │
└────────┬────────┘
         │
         ▼
    ターミナル出力
```

---

## 2. E2Eテスト時のログ出力

### 概要

Playwrightのテスト実行時にページおよびService Workerのconsole出力を自動的にターミナルに表示する。

### ファイル

```
test/e2e/fixtures.ts
```

### 実装箇所

```typescript
// page fixture
page.on('console', (msg) => {
  console.log(`[PAGE ${msg.type()}] ${msg.text()}`);
});

// serviceWorker fixture
worker.on('console', (msg) => {
  console.log(`[SW ${msg.type()}] ${msg.text()}`);
});
```

### 動作

- **デフォルトで有効**（環境変数不要）
- E2Eテスト実行時（`npm run test:e2e`）に自動でログ出力
- ページのconsole出力: `[PAGE log]` 形式
- Service Workerのconsole出力: `[SW log]` 形式

### 出力例

```
$ npm run test:e2e

  ✓ [parallel-tests] › formatting/options.spec.ts:15:5 › ...
[PAGE log] Extension loaded
[SW log] Service worker started
[PAGE log] Settings saved
  ✓ [parallel-tests] › formatting/options.spec.ts:28:5 › ...
```

---

## 関連ファイル

| ファイル                           | 説明                          |
|------------------------------------|-------------------------------|
| `scripts/chrome-console-logger.js` | CDPベースのログ監視スクリプト |
| `test/e2e/fixtures.ts`             | Playwrightテストフィクスチャ  |
| `playwright.config.ts`             | Playwright設定                |
