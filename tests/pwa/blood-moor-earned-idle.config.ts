import { defineConfig, devices } from '@playwright/test';
import { realpathSync, readFileSync } from 'node:fs';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const repo = realpathSync(fileURLToPath(new URL('../..', import.meta.url)));
const rawInput = process.env.MOOR_PILOT_RAW_ROOT;
if (!rawInput || !isAbsolute(rawInput)) throw new Error('External pilot RAW root required');
const raw = realpathSync(rawInput);
const relation = relative(repo, raw);
if (!(relation === '..' || relation.startsWith(`..${sep}`) || isAbsolute(relation))) throw new Error('Pilot RAW must be outside repository');
const owner = JSON.parse(readFileSync(join(raw, 'ownership.json'), 'utf8')) as { owner?: string };
if (owner.owner !== 'root') throw new Error('Pilot RAW ownership marker missing');
const outputDir = process.env.MOOR_PILOT_OUTPUT_DIR;
if (!outputDir || resolve(outputDir) !== join(raw, 'attachments')) throw new Error('Exact owned attachments output required');
const port = Number(process.env.MOOR_PILOT_PORT ?? 4347);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid pilot port');
const baseURL = `http://127.0.0.1:${String(port)}`;
/** Build/test-bridge guard runs separately before this bounded production pilot. */
export default defineConfig({
  testDir: '.', testMatch: ['blood-moor-earned-idle.spec.ts'],
  fullyParallel: false, forbidOnly: true, retries: 0, workers: 1, timeout: 180_000,
  reporter: 'line', outputDir,
  use: { baseURL, serviceWorkers: 'allow', screenshot: 'only-on-failure', trace: 'off' },
  projects: [{ name: 'desktop-en-pilot', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } }],
  webServer: { cwd: repo,
    command: `node_modules/.bin/vite preview --port ${String(port)} --host 127.0.0.1 --strictPort`,
    url: baseURL, reuseExistingServer: false, timeout: 30_000 }
});
