import { spawn } from 'child_process';
import path from 'path';

const profileDir = path.resolve('.chrome-profile');

console.log('🎯 Enveil Debug Mode');
console.log(`   Profile: enveil-debug (${profileDir})`);
console.log('   CDP Port: 9222');
console.log('   Features: HMR enabled, auto-reload on changes');
console.log('');

const wxt = spawn('bun', ['run', 'wxt'], {
  stdio: 'inherit',
});

wxt.on('close', (code) => {
  console.log(`\nWXT exited with code ${code}`);
});

console.log('✅ Session running... (Ctrl+C to stop)');
