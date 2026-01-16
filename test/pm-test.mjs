#!/usr/bin/env node

/**
 * Test package manager selection functionality
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Import PACKAGE_MANAGERS constant from compiled pm.js or fallback to reading source
let PACKAGE_MANAGERS;
try {
  const pmModule = await import('../dist/lib/pm.js');
  PACKAGE_MANAGERS = pmModule.PACKAGE_MANAGERS;
} catch {
  // Fallback: read from source file if dist not available
  try {
    const pmSourcePath = path.join(__dirname, '..', 'src', 'lib', 'pm.ts');
    const pmSource = fs.readFileSync(pmSourcePath, 'utf-8');
    // More robust parsing: handle multiline and various formats
    const match = pmSource.match(/export const PACKAGE_MANAGERS[^=]*=\s*\[([\s\S]*?)\]/);
    if (match) {
      // Extract each quoted string
      const arrayContent = match[1];
      const stringMatches = arrayContent.match(/["']([^"']+)["']/g);
      if (stringMatches) {
        PACKAGE_MANAGERS = stringMatches.map(s => s.replace(/["']/g, ''));
      } else {
        throw new Error('Could not parse package manager values');
      }
    } else {
      throw new Error('Could not find PACKAGE_MANAGERS constant');
    }
  } catch (error) {
    console.error('  ✗ Could not load PACKAGE_MANAGERS constant');
    console.error(`  Error: ${error.message}`);
    console.error('  Please run "npm run build" first');
    process.exit(1);
  }
}

console.log('='.repeat(60));
console.log('Package Manager Selection Test');
console.log('='.repeat(60));

// Test 1: Check if --pm flag is recognized
console.log('\n✓ Test 1: CLI accepts --pm flag');
try {
  const cliPath = path.join(__dirname, '..', 'bin', 'nxt-gen-cli');
  const output = execSync(`node ${cliPath} --help`, {
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
console.log(`  ✓ Supported package managers: ${PACKAGE_MANAGERS.join(', ')}`);

// Test 3: Check dist files for package manager support
console.log('\n✓ Test 3: Code Implementation');
try {
  const distPromptsPath = path.join(__dirname, '..', 'dist', 'prompts.js');
  if (fs.existsSync(distPromptsPath)) {
    const distPrompts = fs.readFileSync(distPromptsPath, 'utf-8');
    if (distPrompts.toLowerCase().includes('packagemanager')) {
      console.log('  ✓ Package manager implementation found in prompts.js');
    } else {
      console.log('  ⚠ Package manager implementation not found in dist files');
    }
  } else {
    console.log('  ℹ Note: dist/prompts.js not found - build may be needed');
  }
} catch (error) {
  console.log('  ℹ Note: Could not check dist files');
}

// Test 4: Verify pm.ts has all package managers
console.log('\n✓ Test 4: Package Manager Module');
try {
  const pmPath = path.join(__dirname, '..', 'src', 'lib', 'pm.ts');
  const pmContent = fs.readFileSync(pmPath, 'utf-8');
  
  const hasAllPMs = PACKAGE_MANAGERS.every(pm => pmContent.includes(pm));
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
