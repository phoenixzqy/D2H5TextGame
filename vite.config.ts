import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import Ajv2020, { type ValidateFunction } from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import fs from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';

const rootDir = __dirname;
const dataRoot = path.resolve(rootDir, 'src/data');
const dataPathPattern = /^src\/data\/[a-z0-9_/.-]+\.json$/;

const schemaRules: readonly { readonly pattern: RegExp; readonly schemaFile: string }[] = [
  { pattern: /^src\/data\/classes\/[a-z0-9-]+\.json$/, schemaFile: 'class.schema.json' },
  { pattern: /^src\/data\/skills\/[a-z0-9-]+\.json$/, schemaFile: 'skill.schema.json' },
  { pattern: /^src\/data\/monsters\/[a-z0-9-]+\.json$/, schemaFile: 'monster.schema.json' },
  { pattern: /^src\/data\/items\/bases\.json$/, schemaFile: 'item-base.schema.json' },
  { pattern: /^src\/data\/items\/uniques\.json$/, schemaFile: 'unique.schema.json' },
  { pattern: /^src\/data\/items\/sets\.json$/, schemaFile: 'set.schema.json' },
  { pattern: /^src\/data\/maps\/sub-areas\/[a-z0-9-]+\.json$/, schemaFile: 'sub-area.schema.json' }
];

interface DevWriteBody {
  readonly path: string;
  readonly json: unknown;
}

function devDataPlugin(): Plugin {
  return {
    name: 'd2h5-dev-data-middleware',
    configureServer(server) {
      const validators = new Map<string, ValidateFunction>();
      server.middlewares.use((req, res, next) => {
        void (async () => {
          const url = new URL(req.url ?? '/', 'http://localhost');
          if (url.pathname !== '/__dev/data') {
            next();
            return;
          }
          if (!isLoopback(req.socket.remoteAddress)) {
            sendJson(res, 403, { error: 'Dev data endpoint only accepts loopback clients.' });
            return;
          }
          try {
            if (req.method === 'GET') {
              handleDevDataGet(url, res);
              return;
            }
            if (req.method === 'POST') {
              await handleDevDataPost(req, res, validators);
              server.ws.send({ type: 'full-reload' });
              return;
            }
            sendJson(res, 405, { error: 'Method not allowed.' });
          } catch (error) {
            sendJson(res, 400, { error: error instanceof Error ? error.message : 'Dev data request failed.' });
          }
        })();
      });
    }
  };
}

function handleDevDataGet(url: URL, res: ServerResponse): void {
  const requestedPath = url.searchParams.get('path') ?? '';
  const absPath = resolveDataFile(requestedPath);
  const json = JSON.parse(fs.readFileSync(absPath, 'utf8')) as unknown;
  sendJson(res, 200, { path: requestedPath, json });
}

async function handleDevDataPost(
  req: IncomingMessage,
  res: ServerResponse,
  validators: Map<string, ValidateFunction>
): Promise<void> {
  const body = JSON.parse(await readBody(req)) as unknown;
  if (!isDevWriteBody(body)) {
    sendJson(res, 400, { error: 'Expected body { path: string, json: unknown }.' });
    return;
  }
  const absPath = resolveDataFile(body.path);
  validateJson(body.path, body.json, validators);
  fs.writeFileSync(absPath, `${JSON.stringify(body.json, null, 2)}\n`, 'utf8');
  sendJson(res, 200, { ok: true });
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk: string) => {
      body += chunk;
      if (body.length > 2_000_000) reject(new Error('Request body is too large.'));
    });
    req.on('end', () => { resolve(body); });
    req.on('error', reject);
  });
}

function resolveDataFile(requestedPath: string): string {
  if (!dataPathPattern.test(requestedPath)) {
    throw new Error('Path must match src/data/[a-z0-9_/.-]+.json.');
  }
  const absPath = path.resolve(rootDir, requestedPath);
  const lowerAbs = absPath.toLowerCase();
  const lowerDataRoot = `${dataRoot.toLowerCase()}${path.sep}`;
  if (!lowerAbs.startsWith(lowerDataRoot)) {
    throw new Error('Path must stay within src/data/.');
  }
  return absPath;
}

function validateJson(
  requestedPath: string,
  json: unknown,
  validators: Map<string, ValidateFunction>
): void {
  const rule = schemaRules.find((candidate) => candidate.pattern.test(requestedPath));
  if (!rule) {
    throw new Error(`No dev-tool schema mapping for ${requestedPath}.`);
  }
  const validate = getValidator(rule.schemaFile, validators);
  const entries = Array.isArray(json) ? json : [json];
  entries.forEach((entry, index) => {
    if (!validate(entry)) {
      const details = (validate.errors ?? [])
        .map((error) => `${error.instancePath || '/'} ${error.message ?? 'is invalid'}`)
        .join('; ');
      throw new Error(`Schema validation failed at entry ${String(index)}: ${details}`);
    }
  });
}

function getValidator(schemaFile: string, validators: Map<string, ValidateFunction>): ValidateFunction {
  const cached = validators.get(schemaFile);
  if (cached) return cached;
  const schemaPath = path.resolve(rootDir, 'src/data/schema', schemaFile);
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8')) as object;
  const ajv = new Ajv2020({ strict: true, allErrors: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  validators.set(schemaFile, validate);
  return validate;
}

function isDevWriteBody(value: unknown): value is DevWriteBody {
  return typeof value === 'object' && value !== null &&
    typeof (value as { path?: unknown }).path === 'string' &&
    'json' in value;
}

function isLoopback(address: string | undefined): boolean {
  if (!address) return false;
  return address === '::1' || address === '127.0.0.1' ||
    address.startsWith('127.') || address.startsWith('::ffff:127.');
}

function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    devDataPlugin(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'D2 H5 Text Game',
        short_name: 'D2 文字版',
        description: '暗黑破坏神2 文字游戏 HTML5 版',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'zh-CN',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'game-engine': ['zustand', 'dexie', 'dexie-react-hooks'],
          'i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector']
        }
      }
    }
  }
});
