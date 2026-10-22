import { defineConfig, devices } from '@playwright/test';
import { readFileSync, realpathSync } from 'node:fs';
import { isAbsolute, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = realpathSync(fileURLToPath(new URL('../..', import.meta.url)));
const input = process.env.EARNED_CORPSE_ROOT;
if (!input || !isAbsolute(input)) throw new Error('External owned evidence root required');
const root = realpathSync(input), relation = relative(repo, root);
if (!(relation === '..' || relation.startsWith(`..${sep}`) || isAbsolute(relation))) {
  throw new Error('Evidence root must be outside the repository');
}
const owner = JSON.parse(readFileSync(join(root, 'ownership.json'), 'utf8')) as { owner?: string };
if (owner.owner !== 'root') throw new Error('Missing evidence ownership marker');
const dist = `'${join(root, 'dist').replace(/'/g, "'\\''")}'`;
const port = Number(process.env.PWA_PORT ?? 4399);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid preview port');
const baseURL = `http://127.0.0.1:${String(port)}`;

/** One frozen experiment. Completion verifies the protocol; inspect the outcome attachment for reachability. */
export default defineConfig({
  testDir: '.', testMatch: 'corpse-explosion-earned.spec.ts',
  fullyParallel: false, forbidOnly: true, workers: 1, retries: 0, maxFailures: 1, timeout: 240_000,
  outputDir: join(root, 'attachments'),
  reporter: [['line'], ['json', { outputFile: join(root, 'browser-report.json') }]],
  use: { baseURL, serviceWorkers: 'allow', trace: 'off', video: 'off', screenshot: 'only-on-failure' },
  projects: [{ name: 'earned-corpse-desktop-en', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } }],
  webServer: { cwd: repo,
    command: `node_modules/.bin/vite preview --outDir ${dist} --port ${String(port)} --host 127.0.0.1 --strictPort`,
    url: baseURL, reuseExistingServer: false, timeout: 20_000 }
});
