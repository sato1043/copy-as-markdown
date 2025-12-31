#!/usr/bin/env node

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as process from 'node:process';

const destination = process.argv[2];

fs.cpSync(path.join(import.meta.dirname, '..', 'dist/'), `${destination}/dist/`, { recursive: true });
fs.cpSync(path.join(import.meta.dirname, '..', 'src/vendor'), `${destination}/dist/vendor`, { recursive: true });
fs.cpSync(path.join(import.meta.dirname, '..', 'src/static'), `${destination}/dist/static`, { recursive: true });

// Content scripts cannot use ESM format. TypeScript adds `export {};` to files
// without imports/exports. We need to strip this from content scripts.
const contentScriptsDir = path.join(destination, 'dist', 'content-scripts');
if (fs.existsSync(contentScriptsDir)) {
  const files = fs.readdirSync(contentScriptsDir);
  for (const file of files) {
    if (file.endsWith('.js')) {
      const filePath = path.join(contentScriptsDir, file);
      let content = fs.readFileSync(filePath, 'utf-8');
      // Remove ESM export statement that TypeScript adds
      content = content.replace(/\nexport\s*\{\s*\};\s*$/, '\n');
      fs.writeFileSync(filePath, content, 'utf-8');
    }
  }
}
