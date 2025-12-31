import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const testCases = [
  {
    name: 'minimal-app',
    inputs: [
      'n', // prisma
      'n', // react-query
      'n', // axios
      'none', // ui
      'n', // framer-motion
      'y', // lucide
      'none', // examples
      'n', // docker
      'n', // ci
      'n', // husky
      'n', // vitest
      'n', // playwright
      'n', // storybook
      'n', // forms
      'n', // intl
      'none', // license
      'none', // auth
    ]
  },
  {
    name: 'full-stack-app',
    inputs: [
      'y', // prisma
      'y', // react-query
      'y', // axios
      'shadcn', // ui
      'y', // framer-motion
      'y', // lucide
      'none', // examples
      'y', // docker
      'y', // ci
      'y', // husky
      'y', // vitest
      'y', // playwright
      'y', // storybook
      'y', // forms
      'y', // intl
      'MIT', // license
      'next-auth', // auth
    ]
  },
  {
    name: 'auth-forms-app',
    inputs: [
      'y', // prisma
      'y', // react-query
      'n', // axios
      'heroui', // ui
      'n', // framer-motion
      'y', // lucide
      'none', // examples
      'n', // docker
      'n', // ci
      'n', // husky
      'n', // vitest
      'n', // playwright
      'n', // storybook
      'y', // forms
      'y', // intl
      'Apache', // license
      'clerk', // auth
    ]
  }
];

async function runTest(testCase) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${testCase.name}`);
  console.log('='.repeat(60));

  const projectPath = path.join(__dirname, testCase.name);
  
  // Clean up if exists
  if (await fs.pathExists(projectPath)) {
    await fs.remove(projectPath);
  }

  return new Promise((resolve, reject) => {
    const cli = spawn('node', ['../bin/nxt-gen-cli', testCase.name], {
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let currentInputIndex = 0;
    let output = '';
    let errorOutput = '';

    cli.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(text);

      // Send next input when we see a prompt
      if (text.includes('?') && currentInputIndex < testCase.inputs.length) {
        setTimeout(() => {
          const input = testCase.inputs[currentInputIndex];
          console.log(`[AUTO-INPUT ${currentInputIndex + 1}/${testCase.inputs.length}]: ${input}`);
          cli.stdin.write(input + '\n');
          currentInputIndex++;
        }, 100);
      }
    });

    cli.stderr.on('data', (data) => {
      const text = data.toString();
      errorOutput += text;
      process.stderr.write(text);
    });

    cli.on('close', async (code) => {
      console.log(`\n${testCase.name} exited with code ${code}`);
      
      if (code === 0) {
        // Verify key files exist
        const checks = [
          'package.json',
          'README.md',
          'src/app/layout.tsx'
        ];

        console.log('\nVerifying generated files:');
        for (const file of checks) {
          const exists = await fs.pathExists(path.join(projectPath, file));
          console.log(`  ${exists ? '✓' : '✗'} ${file}`);
        }

        resolve({ success: true, testCase: testCase.name });
      } else {
        reject({ success: false, testCase: testCase.name, code, errorOutput });
      }
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      cli.kill();
      reject({ success: false, testCase: testCase.name, error: 'Timeout' });
    }, 300000);
  });
}

async function runAllTests() {
  const results = [];
  
  for (const testCase of testCases) {
    try {
      const result = await runTest(testCase);
      results.push(result);
    } catch (error) {
      results.push(error);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  
  results.forEach(r => {
    console.log(`${r.success ? '✓' : '✗'} ${r.testCase}`);
  });

  const passed = results.filter(r => r.success).length;
  console.log(`\n${passed}/${results.length} tests passed`);
  
  process.exit(passed === results.length ? 0 : 1);
}

runAllTests().catch(console.error);
