# Firefox XPI テストと署名

## XPI テストが必要な場面

Firefox の再起動時の動作（例: コンテキストメニューが正しくインストールされているか）をデバッグするには、XPI パッケージをビルドして Firefox にインストールする必要がある。一時的なアドオンは Firefox 終了後にアンインストールされるため、十分ではない。

## 署名なし XPI のサイドロード

Firefox は XPI インストール時に署名を確認し、リリース版 Firefox ではこれを無効にできない。

署名されていない XPI をサイドロードするには以下のバージョンを使用:
- Firefox Developer Edition
- Firefox Nightly
- ブランドなし Beta

参考: [Testing persistent and restart features (Extension Workshop)](https://extensionworkshop.com/documentation/develop/testing-persistent-and-restart-features/)

### 手順

1. `npm run build-firefox-mv3` を実行
   - XPI は `./build/firefox-mv3` フォルダに保存される
2. Firefox Developer Edition で `about:config` に移動
   - `xpinstall.signatures.required` を `false` に設定
   - ブラウザを再起動
3. `about:addons` に移動
   - XPI ファイルをページにドラッグ＆ドロップしてインストール
4. ブラウザを再起動して動作確認

## XPI への署名（AMO 経由）

リリース版 Firefox でのサイドロードが必要な場合:

1. [API キー](https://addons.mozilla.org/en-US/developers/addon/api/key/) を取得
2. `manifest.json` のバージョンを更新
   - AMO は `X.Y.Z` 形式のみ受け付ける（3セグメント全てゼロプレフィックスなしの数字）
3. 署名コマンドを実行:
   ```shell
   web-ext sign --channel=unlisted --api-key=... --api-secret=...
   ```

注意:
- 署名された XPI が作成され、Add-On Developer Hub に非公開としてアップロードされる
- Firefox Add-On は `channel=unlisted` を含む全バージョンを追跡している

参考: <https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/>
