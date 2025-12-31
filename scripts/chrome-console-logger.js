#!/usr/bin/env node
/**
 * Chrome Console Logger
 *
 * Chrome DevTools Protocol を使用してリモートデバッグ中の
 * Chrome から console.log 出力をリアルタイムで取得する
 *
 * 使い方:
 * 1. Chrome をリモートデバッグモードで起動:
 *    /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
 *      --remote-debugging-port=9222 \
 *      --user-data-dir=/tmp/chrome-debug \
 *      --load-extension=$(pwd)/chrome
 *
 * 2. このスクリプトを実行:
 *    node scripts/chrome-console-logger.js
 */

const WebSocket = require('ws');
const process = require('node:process');

const PORT = process.env.CDP_PORT || 9222;
const RECONNECT_INTERVAL = 3000;

/** @type {Set<string>} */
const connectedUrls = new Set();

/** @type {Map<string, WebSocket>} */
const connections = new Map();

/**
 * console出力のタイプに応じた色を返す
 * @param {string} type
 * @returns {string} ANSIカラーコード
 */
function getColor(type) {
  const colors = {
    log: '\x1B[0m', // default
    info: '\x1B[36m', // cyan
    warn: '\x1B[33m', // yellow
    error: '\x1B[31m', // red
    debug: '\x1B[90m', // gray
  };
  return colors[type] || colors.log;
}

const RESET = '\x1B[0m';

/**
 * ページタイトルを短縮
 * @param {string} title
 * @param {number} maxLen
 * @returns {string} 短縮されたタイトル
 */
function truncate(title, maxLen = 30) {
  if (!title) return '(no title)';
  return title.length > maxLen ? `${title.slice(0, maxLen - 3)}...` : title;
}

/**
 * 単一ページ/ターゲットに接続
 * @param {{ webSocketDebuggerUrl?: string, title: string, url: string, type: string }} target
 */
function connectToTarget(target) {
  const { webSocketDebuggerUrl, title, url, type } = target;

  if (!webSocketDebuggerUrl) return;
  if (connectedUrls.has(webSocketDebuggerUrl)) return;

  connectedUrls.add(webSocketDebuggerUrl);

  const ws = new WebSocket(webSocketDebuggerUrl);
  connections.set(webSocketDebuggerUrl, ws);

  const label = type === 'service_worker' ? 'SW' : 'PAGE';
  const displayTitle = truncate(title || url);

  ws.on('open', () => {
    // Runtime.enable で console イベントを有効化
    ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
    console.log(`\x1B[32m[接続]\x1B[0m [${label}] ${displayTitle}`);
  });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.method === 'Runtime.consoleAPICalled') {
        const { type: msgType, args, timestamp } = msg.params;
        const color = getColor(msgType);
        const text = args
          .map(a => a.value ?? a.description ?? JSON.stringify(a))
          .join(' ');

        const time = new Date(timestamp).toLocaleTimeString('ja-JP');
        console.log(`${color}[${label} ${msgType}]${RESET} ${time} ${text}`);
      }

      if (msg.method === 'Runtime.exceptionThrown') {
        const { exceptionDetails } = msg.params;
        const text = exceptionDetails.text || exceptionDetails.exception?.description || 'Unknown error';
        console.log(`\x1B[31m[${label} exception]\x1B[0m ${text}`);
      }
    } catch {
      // ignore parse errors
    }
  });

  ws.on('close', () => {
    console.log(`\x1B[33m[切断]\x1B[0m [${label}] ${displayTitle}`);
    connectedUrls.delete(webSocketDebuggerUrl);
    connections.delete(webSocketDebuggerUrl);
  });

  ws.on('error', (err) => {
    console.error(`\x1B[31m[エラー]\x1B[0m [${label}] ${err.message}`);
    connectedUrls.delete(webSocketDebuggerUrl);
    connections.delete(webSocketDebuggerUrl);
  });
}

/**
 * 利用可能なターゲット一覧を取得して接続
 */
async function pollTargets() {
  try {
    const res = await fetch(`http://localhost:${PORT}/json`);
    const targets = await res.json();

    for (const target of targets) {
      connectToTarget(target);
    }
  } catch {
    // Chrome が起動していない場合は静かに待機
  }
}

/**
 * メイン
 */
async function main() {
  console.log(`Chrome Console Logger`);
  console.log(`CDP port: ${PORT}`);
  console.log(`---`);
  console.log(`Chrome を以下のコマンドで起動:`);
  console.log(`  /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome \\`);
  console.log(`    --remote-debugging-port=${PORT} \\`);
  console.log(`    --user-data-dir=/tmp/chrome-debug \\`);
  console.log(`    --load-extension=$(pwd)/chrome`);
  console.log(`---`);
  console.log(`待機中... (Ctrl+C で終了)\n`);

  // 定期的に新しいターゲットをポーリング
  await pollTargets();
  setInterval(pollTargets, RECONNECT_INTERVAL);
}

main().catch(console.error);
