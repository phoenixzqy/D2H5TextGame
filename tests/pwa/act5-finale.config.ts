import { defineConfig } from '@playwright/test';
import delivery from './act5-delivery.config';

if (!process.env.ACT5_FINALE_INPUT_SAVE) throw new Error('Provide actual prior service export');

/** Native service export retains its explicitly constructed combat ancestry. */
export default defineConfig({ ...delivery, testMatch: ['act5-finale.spec.ts'] });
