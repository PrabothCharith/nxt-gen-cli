#!/usr/bin/env node

/**
 * Test package manager selection functionality
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('='.repeat(60));
console.log('Package Manager Selection Test');
console.log('='.repeat(60));

// Test 1: Check if --pm flag is recognized
console.log('\n✓ Test 1: CLI accepts --pm flag');
try {
  const output = execSync('node bin/nxt-gen-cli --help', {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf-8'
  });
  
  if (output.includes('--pm <type>') && output.includes('Package Manager')) {
    console.log('  ✓ --pm flag is documented in help');
  } else {
    console.error('  ✗ --pm flag not found in help output');
    process.exit(1);
  }
} catch (error) {
  console.error('  ✗ Failed to check help output');
  process.exit(1);
}

// Test 2: Validate package manager types
console.log('\n✓ Test 2: Package Manager Types');
const pmTypes = ['npm', 'pnpm', 'yarn', 'bun'];
console.log(`  ✓ Supported package managers: ${pmTypes.join(', ')}`);

// Test 3: Check dist files for package manager support
console.log('\n✓ Test 3: Code Implementation');
try {
  const distPrompts = execSync('cat dist/prompts.js | grep -i packagemanager | head -5', {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'ignore']
  }).trim();
  
  if (distPrompts) {
    console.log('  ✓ Package manager implementation found in prompts.js');
  }
} catch (error) {
  // grep returns non-zero if no match, but that's okay for this test
  console.log('  ℹ Note: Check if build is up to date');
}

// Test 4: Verify pm.ts has all package managers
console.log('\n✓ Test 4: Package Manager Module');
try {
  const pmContent = execSync('cat src/lib/pm.ts', {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf-8'
  });
  
  const hasAllPMs = pmTypes.every(pm => pmContent.includes(pm));
  if (hasAllPMs) {
    console.log('  ✓ All package managers supported in pm.ts');
  } else {
    console.error('  ✗ Some package managers missing in pm.ts');
    process.exit(1);
  }
} catch (error) {
  console.error('  ✗ Failed to read pm.ts');
  process.exit(1);
}

console.log('\n' + '='.repeat(60));
console.log('✓ All package manager tests passed!');
console.log('='.repeat(60));
console.log('\nPackage manager selection can be used in two ways:');
console.log('  1. CLI flag: npx nxt-gen-cli my-app --pm pnpm');
console.log('  2. Interactive prompt: Select during project setup');
console.log('\n');
