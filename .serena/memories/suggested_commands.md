# Suggested Commands

## Development

### Install Dependencies
```bash
npm install -g web-ext  # グローバルインストール（初回のみ）
npm install
```

### Build
```bash
npm run compile           # 全プラットフォーム向けにコンパイル
npm run compile-chrome    # Chrome向けのみ
npm run compile-firefox-mv2  # Firefox MV2向け
npm run compile-firefox-mv3  # Firefox MV3向け
```

### Debug (Auto-reload)
```bash
npm run debug-chrome      # Chrome
npm run debug-firefox-mv3 # Firefox MV3
npm run debug-firefox-mv2 # Firefox MV2
npm run debug-edge        # Edge
```

### 手動デバッグ（自動リロードなし）
- Chrome: [ウィンドウ] メニュー -> 拡張機能 -> パッケージ化されていない拡張機能を読み込む
- Firefox: [ツール] メニュー -> アドオン -> [歯車] アイコン -> アドオンをデバッグ -> 一時的なアドオンを読み込む

## Testing

### Unit Tests
```bash
npm test                  # vitestでユニットテスト実行
npm run test:watch        # ウォッチモード
npm run test:ui           # vitest UI
```

### E2E Tests
```bash
npm run test:e2e          # Playwright E2Eテスト
npm run test:e2e:headed   # ヘッドモード
npm run test:e2e:docker   # Docker内でE2E（CI環境と同等）
```

### All Tests
```bash
npm run test:all          # ユニット + E2E
```

## Code Quality

### Lint
```bash
npm run lint              # ESLintチェック
npm run lint:fix          # 自動修正
```

### Type Check
```bash
npm run typecheck         # TypeScript型チェック
```

## Build for Distribution
```bash
npm run build-chrome      # -> build/chrome.zip
npm run build-firefox-mv3 # -> build/firefox-mv3/*.xpi
npm run build-firefox-mv2 # -> build/firefox-mv2/*.xpi
```

## Utility
```bash
npm run clean             # ビルド成果物をクリーンアップ
```

## System Commands (Darwin/macOS)
```bash
git status                # Gitステータス確認
ls -la                    # ファイル一覧
find . -name "*.ts"       # ファイル検索
grep -r "pattern" src/    # パターン検索
```
