#!/usr/bin/env node

/**
 * Simple CLI test runner
 * Tests the CLI by checking if it can be invoked and validates the build
 */

import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('='.repeat(60));
console.log('CLI Build & Smoke Test');
console.log('='.repeat(60));

// Test 1: Check if CLI builds
console.log('\n✓ Test 1: Build Check');
try {
  execSync('npm run build', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
  console.log('  ✓ Build successful');
} catch (error) {
  console.error('  ✗ Build failed');
  process.exit(1);
}

// Test 2: Check if CLI can be invoked
console.log('\n✓ Test 2: CLI Invocation');
try {
  const output = execSync('node bin/nxt-gen-cli --version', { 
    cwd: path.join(__dirname, '..'),
    encoding: 'utf-8'
  });
  console.log(`  ✓ CLI responds with version: ${output.trim()}`);
} catch (error) {
  console.error('  ✗ CLI invocation failed');
  process.exit(1);
}

// Test 3: Check all template files exist
console.log('\n✓ Test 3: Template Files');
const templateFiles = [
  'src/templates/examples.ts',
  'src/templates/devops.ts',
  'src/templates/testing.ts',
  'src/templates/docs.ts',
  'src/templates/auth.ts',
  'src/templates/forms.ts',
  'src/templates/intl.ts',
];

let allTemplatesExist = true;
for (const file of templateFiles) {
  const exists = fs.existsSync(path.join(__dirname, '..', file));
  console.log(`  ${exists ? '✓' : '✗'} ${file}`);
  if (!exists) allTemplatesExist = false;
}

if (!allTemplatesExist) {
  console.error('\n✗ Some template files are missing');
  process.exit(1);
}

// Test 4: Check dist files
console.log('\n✓ Test 4: Compiled Output');
const distFiles = ['dist/index.js', 'dist/scaffold.js', 'dist/prompts.js'];
let allDistFilesExist = true;
for (const file of distFiles) {
  const exists = fs.existsSync(path.join(__dirname, '..', file));
  console.log(`  ${exists ? '✓' : '✗'} ${file}`);
  if (!exists) allDistFilesExist = false;
}

if (!allDistFilesExist) {
  console.error('\n✗ Some dist files are missing');
  process.exit(1);
}

console.log('\n' + '='.repeat(60));
console.log('✓ All smoke tests passed!');
console.log('='.repeat(60));
console.log('\nTo test interactively, run:');
console.log('  node bin/nxt-gen-cli my-test-app');
console.log('\n');
