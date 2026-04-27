import * as fs from 'fs';
import * as path from 'path';

describe('Dependencies Installation', () => {
  test('package.json has all required runtime dependencies', () => {
    const packagePath = path.join(__dirname, 'package.json');
    const packageContent = fs.readFileSync(packagePath, 'utf-8');
    const pkg = JSON.parse(packageContent);
    
    const dependencies = pkg.dependencies || {};
    
    expect(dependencies.express).toBeDefined();
    expect(dependencies.mongoose).toBeDefined();
    expect(dependencies.redis).toBeDefined();
    expect(dependencies.zod).toBeDefined();
    expect(dependencies.bcrypt).toBeDefined();
    expect(dependencies.jsonwebtoken).toBeDefined();
    expect(dependencies.dotenv).toBeDefined();
    expect(dependencies.uuid).toBeDefined();
    expect(dependencies.ioredis).toBeDefined();
  });

  test('package.json has all required dev dependencies', () => {
    const packagePath = path.join(__dirname, 'package.json');
    const packageContent = fs.readFileSync(packagePath, 'utf-8');
    const pkg = JSON.parse(packageContent);
    
    const devDependencies = pkg.devDependencies || {};
    
    expect(devDependencies['@types/express']).toBeDefined();
    expect(devDependencies['@types/mongoose']).toBeDefined();
    expect(devDependencies['@types/redis']).toBeDefined();
    expect(devDependencies['@types/bcrypt']).toBeDefined();
    expect(devDependencies['@types/jsonwebtoken']).toBeDefined();
    expect(devDependencies['@types/uuid']).toBeDefined();
    expect(devDependencies['mongodb-memory-server']).toBeDefined();
    expect(devDependencies.supertest).toBeDefined();
  });
});