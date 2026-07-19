import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dir, '..', '..');

// Guards for the deployment-level performance fixes: keep the serverless
// function next to the Supabase project (eu-central-1 / Frankfurt) and keep
// coverage instrumentation out of production builds.
describe('deployment performance config', () => {
  test('serverless functions are pinned to fra1, co-located with Supabase', () => {
    const vercel = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'));

    expect(vercel.regions).toEqual(['fra1']);
  });

  test('no Babel config is committed - production builds must use SWC', () => {
    expect(existsSync(join(root, '.babelrc'))).toBe(false);
    expect(existsSync(join(root, 'babel.config.js'))).toBe(false);
    expect(existsSync(join(root, 'babel.config.json'))).toBe(false);
  });

  test('CI generates the istanbul .babelrc only for the instrumented test build', () => {
    const workflow = readFileSync(
      join(root, '.github', 'workflows', 'e2e-tests.yml'),
      'utf8',
    );

    expect(workflow).toContain('> .babelrc');
    expect(workflow).toContain('istanbul');
  });

  test('root route has a loading skeleton so SSR can stream a first paint', () => {
    expect(existsSync(join(root, 'src', 'app', 'loading.tsx'))).toBe(true);
  });
});
