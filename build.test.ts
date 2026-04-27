import * as fs from 'fs';
import * as path from 'path';

describe('Build Configuration', () => {
  test('tsup.config.ts exists', () => {
    const tsupPath = path.join(__dirname, 'tsup.config.ts');
    expect(fs.existsSync(tsupPath)).toBe(true);
  });

  test('package.json has all required scripts', () => {
    const packagePath = path.join(__dirname, 'package.json');
    const packageContent = fs.readFileSync(packagePath, 'utf-8');
    const pkg = JSON.parse(packageContent);
    
    expect(pkg.scripts.dev).toBeDefined();
    expect(pkg.scripts.build).toBeDefined();
    expect(pkg.scripts.start).toBeDefined();
    expect(pkg.scripts.test).toBeDefined();
    expect(pkg.scripts['test:unit']).toBeDefined();
    expect(pkg.scripts['test:integration']).toBeDefined();
    expect(pkg.scripts['test:e2e']).toBeDefined();
    expect(pkg.scripts.lint).toBeDefined();
    expect(pkg.scripts.typecheck).toBeDefined();
  });

  test('package.json main points to dist/index.js', () => {
    const packagePath = path.join(__dirname, 'package.json');
    const packageContent = fs.readFileSync(packagePath, 'utf-8');
    const pkg = JSON.parse(packageContent);
    
    expect(pkg.main).toBe('dist/index.js');
  });
});