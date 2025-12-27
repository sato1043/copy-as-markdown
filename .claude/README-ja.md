# Copy as Markdown for Chrome & Firefox

NOTE: This is the Japanese version of README.md. (Duplicate content from the AI memory files is replaced with reference links.)

リンクや画像の Markdown コードを手動で入力したり、ウィンドウ内の全タブを記述したりするのに疲れていませんか？ **Copy as Markdown** がお手伝いします！

## ダウンロード

* Google Chrome: [Chrome Web Store - Copy as Markdown](https://chrome.google.com/webstore/detail/copy-as-markdown/fkeaekngjflipcockcnpobkpbbfbhmdn)
* Firefox: [Copy as Markdown :: Add-ons for Firefox](https://addons.mozilla.org/firefox/addon/copy-as-markdown/)
* Microsoft Edge: [Copy as Markdown - Microsoft Edge Addons](https://microsoftedge.microsoft.com/addons/detail/copy-as-markdown/cbbdkefgbfifiljnnklfhnhcnlmpglpd)

## 機能

**Copy as Markdown** は、以下のものを Markdown 形式でシステムクリップボードにコピーできるブラウザ拡張機能である：

ウェブページ上:

:ballot_box_with_check: 選択テキストを Markdown として<br>
:ballot_box_with_check: ページ上のリンク<br>
:ballot_box_with_check: ページ上の画像（リンク付き/なし）

現在のウィンドウのタブをエクスポート（全タブまたはハイライトされたタブ）:

:ballot_box_with_check: 現在のタブをリンクとして<br>
:ballot_box_with_check: リンクのリスト<br>
:ballot_box_with_check: タスクリスト（GitHub Flavored Markdown 用）<br>
:ballot_box_with_check: タブグループ付き（Chrome、Edge など）

## キーボードショートカット

タブを Markdown としてコピーするためのキーボードショートカットを追加できる。デフォルトでは、Copy as Markdown はキーボードショートカットを割り当てていない。

### Firefox

Firefox ヘルプを参照: <https://support.mozilla.org/en-US/kb/manage-extension-shortcuts-firefox>

### Chrome

拡張機能のキーボードショートカットは `chrome://extensions/shortcuts` URL で確認できる（アドレスバーにペーストして開く）。

## 既知の問題

* [Chrome] 画像をコピーする際、画像コードにその画像の代替テキストが含まれない。これは API の制限による。

## 開発

開発に関する詳細情報は serena MCP のメモリファイルを参照:

- `suggested_commands.md` - 開発コマンド一覧
- `codebase_structure.md` - ソース構造、テスト構造
- `firefox_xpi_testing.md` - Firefox XPI テストと署名

### クイックスタート

```bash
# 依存関係のインストール
npm install -g web-ext
npm install

# ビルド
npm run compile

# デバッグ（自動リロード）
npm run debug-chrome
npm run debug-firefox-mv3

# テスト
npm test              # ユニットテスト
npm run test:e2e      # E2E テスト

# 品質チェック
npm run typecheck     # 型チェック
npm run lint          # リント
```

### QA

様々なエッジケースを含む [qa.html](../fixtures/qa.html) がある。ブラウザで開き、その内容で Copy as Markdown を試す。

## ライセンス

[MIT-LICENSE.txt](../MIT-LICENSE.txt) を参照
