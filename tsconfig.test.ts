// Test file for TypeScript configuration
// This is a test to verify tsconfig.json exists and has correct settings

import * as fs from 'fs';
import * as path from 'path';

describe('TypeScript Configuration', () => {
  test('tsconfig.json exists', () => {
    const tsconfigPath = path.join(__dirname, 'tsconfig.json');
    expect(fs.existsSync(tsconfigPath)).toBe(true);
  });

  test('tsconfig.json has strict mode enabled', () => {
    const tsconfigPath = path.join(__dirname, 'tsconfig.json');
    const tsconfigContent = fs.readFileSync(tsconfigPath, 'utf-8');
    const tsconfig = JSON.parse(tsconfigContent);
    expect(tsconfig.compilerOptions?.strict).toBe(true);
  });

  test('tsconfig.json has baseUrl set to src', () => {
    const tsconfigPath = path.join(__dirname, 'tsconfig.json');
    const tsconfigContent = fs.readFileSync(tsconfigPath, 'utf-8');
    const tsconfig = JSON.parse(tsconfigContent);
    expect(tsconfig.compilerOptions?.baseUrl).toBe('./src');
  });

  test('tsconfig.json has path aliases configured', () => {
    const tsconfigPath = path.join(__dirname, 'tsconfig.json');
    const tsconfigContent = fs.readFileSync(tsconfigPath, 'utf-8');
    const tsconfig = JSON.parse(tsconfigContent);
    expect(tsconfig.compilerOptions?.paths).toBeDefined();
    expect(tsconfig.compilerOptions?.paths['@domain/*']).toEqual(['domain/*']);
    expect(tsconfig.compilerOptions?.paths['@application/*']).toEqual(['application/*']);
    expect(tsconfig.compilerOptions?.paths['@infrastructure/*']).toEqual(['infrastructure/*']);
    expect(tsconfig.compilerOptions?.paths['@presentation/*']).toEqual(['presentation/*']);
  });
});