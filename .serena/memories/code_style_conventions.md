# Code Style and Conventions

## ESLint Configuration
`@antfu/eslint-config` を使用。

## Formatting Rules
- インデント: 2スペース
- クォート: シングルクォート
- セミコロン: あり
- ブレーススタイル: 1TBS（単一行許可）

## TypeScript Settings
- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noFallthroughCasesInSwitch: true`
- `noImplicitReturns: true`
- `noUncheckedIndexedAccess: true`

## Allowed Patterns
- `console` 文は許可（拡張機能のログ出力で使用）

## Architecture Pattern
### Browser Adapters
サービスは `createBrowser*` ファクトリパターンを使用し、ブラウザAPI依存を注入する。

```typescript
// 依存性注入によるサービス
export function createBrowserTabExportService(
  tabDataFetcher: TabDataFetcher
): TabExportService { ... }

// background.ts での使用
const tabExportService = createBrowserTabExportService(
  createBrowserTabDataFetcher()
);
```

## Naming Conventions
- ファイル名: kebab-case（例: `tab-export-service.ts`）
- 関数名: camelCase
- クラス/型名: PascalCase
- 定数: UPPER_SNAKE_CASE または camelCase
