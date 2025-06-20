#!/usr/bin/env node
import { execSync } from 'child_process';
import { existsSync, rmSync, readFileSync, writeFileSync } from 'fs';

const VITE_CONFIG = 'vite.config.ts';
const SWC_PKG = '@vitejs/plugin-react-swc';
const REACT_PKG = '@vitejs/plugin-react';
const DIST_DIR = 'dist';

function cleanDist() {
  if (existsSync(DIST_DIR)) {
    rmSync(DIST_DIR, { recursive: true, force: true });
  }
}

function printViteConfigHeader() {
  const config = readFileSync(VITE_CONFIG, 'utf8');
  console.log('\n--- vite.config.ts (first 10 lines) ---');
  console.log(config.split('\n').slice(0, 10).join('\n'));
  console.log('--------------------------------------\n');
}

function runBuild(label) {
  cleanDist();
  printViteConfigHeader();
  console.log(`[${label}] Starting build...`);
  const start = Date.now();
  try {
    execSync('npm run build', { stdio: 'inherit' });
  } catch (e) {
    console.error(`[${label}] Build failed.`);
    process.exit(1);
  }
  const end = Date.now();
  return (end - start) / 1000;
}

function swapVitePlugin(useSwc) {
  let config = readFileSync(VITE_CONFIG, 'utf8');
  // Match: import react from '@vitejs/plugin-react' or '@vitejs/plugin-react-swc'
  const importRegex = /import\s+react\s+from ['"]@vitejs\/plugin-react(-swc)?['"]/;
  const current = importRegex.exec(config);
  if (!current) {
    console.warn('Could not find React plugin import in vite.config.ts!');
    return false;
  }
  let newImport = useSwc
    ? "import react from '@vitejs/plugin-react-swc'"
    : "import react from '@vitejs/plugin-react'";
  config = config.replace(importRegex, newImport);
  writeFileSync(VITE_CONFIG, config, 'utf8');
  return true;
}

function installSwc() {
  execSync(`npm install -D ${SWC_PKG}`, { stdio: 'inherit' });
}
function uninstallSwc() {
  execSync(`npm uninstall ${SWC_PKG}`, { stdio: 'inherit' });
}

function main() {
  console.log('Benchmarking Vite build times...');
  const viteConfigBackup = readFileSync(VITE_CONFIG, 'utf8');

  // 1. Build WITHOUT SWC
  if (!swapVitePlugin(false)) {
    console.error('Failed to swap to @vitejs/plugin-react. Aborting.');
    process.exit(1);
  }
  uninstallSwc();
  const timeNoSwc = runBuild('No SWC');

  // 2. Build WITH SWC
  installSwc();
  if (!swapVitePlugin(true)) {
    console.error('Failed to swap to @vitejs/plugin-react-swc. Aborting.');
    process.exit(1);
  }
  const timeSwc = runBuild('With SWC');

  // 3. Restore vite.config.ts and uninstall SWC
  writeFileSync(VITE_CONFIG, viteConfigBackup, 'utf8');
  uninstallSwc();

  // 4. Print results
  console.log('\n--- Build Benchmark Results ---');
  console.log(`Without SWC: ${timeNoSwc.toFixed(2)}s`);
  console.log(`With SWC:    ${timeSwc.toFixed(2)}s`);
}

main(); 