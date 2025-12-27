# Tech Stack

## Language
- TypeScript (strict mode)
- Target: ES2020
- Module: NodeNext

## Runtime
- Node.js >= 20.0
- Browser Extension APIs (Chrome/Firefox)

## Dependencies
### Production
- `mustache` - テンプレートエンジン（カスタムフォーマット用）

### Development
- `typescript` ^5.4.0
- `vitest` ^3.2.4 - ユニットテスト
- `@vitest/browser` - ブラウザテスト
- `playwright` ^1.57.0 - E2Eテスト
- `eslint` ^9.37.0 + `@antfu/eslint-config` - リンター
- `turndown` ^7.1.3 - HTML→Markdown変換
- `webextension-polyfill` ^0.12.0 - クロスブラウザAPI互換

## Build System
- TypeScript Compiler (`tsc`) → `dist/`
- カスタムスクリプト (`scripts/compile.js`) → プラットフォーム別フォルダへコピー
- `web-ext` - Firefox拡張のパッケージング
