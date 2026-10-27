import { defineConfig } from '@playwright/test';
import base from './assassin-shadow-acceptance.config';

export default defineConfig({ ...base, testMatch: 'assassin-shadow-combined.spec.ts' });
