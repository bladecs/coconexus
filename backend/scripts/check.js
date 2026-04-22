'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const targetDirectories = ['config', 'controllers', 'middlewares', 'migrations', 'models', 'routes', 'scripts', 'utils'];

function walk(directoryPath) {
  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const entryPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      return walk(entryPath);
    }

    if (entry.isFile() && entry.name.endsWith('.js')) {
      return [entryPath];
    }

    return [];
  });
}

const files = targetDirectories.flatMap((directory) => walk(path.resolve(__dirname, '..', directory)));

files.forEach((filePath) => {
  execFileSync(process.execPath, ['-c', filePath], { stdio: 'inherit' });
});

console.log(`Backend syntax check passed for ${files.length} files.`);
