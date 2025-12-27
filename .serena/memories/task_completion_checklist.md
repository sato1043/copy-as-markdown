# Task Completion Checklist

タスク完了時に実行すべき項目。

## 必須チェック

### 1. 型チェック
```bash
npm run typecheck
```
TypeScriptの型エラーがないことを確認。

### 2. リント
```bash
npm run lint
```
ESLintエラーがないことを確認。
自動修正が必要な場合:
```bash
npm run lint:fix
```

### 3. ユニットテスト
```bash
npm test
```
全テストがパスすることを確認。

### 4. ビルド確認
```bash
npm run compile
```
全プラットフォーム向けにビルドが成功することを確認。

## 推奨チェック

### 5. E2Eテスト（大きな変更時）
```bash
npm run test:e2e
```

### 6. 手動QA
`fixtures/qa.html` をブラウザで開き、拡張機能の動作を確認。

## コミット前
- `git status` で変更内容を確認
- 無関係な変更が含まれていないか確認
- コミットメッセージは変更内容を明確に記述
