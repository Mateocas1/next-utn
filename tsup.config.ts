import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  dts: false,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  target: 'node22',
  tsconfig: 'tsconfig.json',
  external: [
    'express',
    'mongoose',
    'redis',
    'zod',
    'bcrypt',
    'jsonwebtoken',
    'dotenv',
    'uuid',
    'ioredis',
    'node-redis',
  ],
});