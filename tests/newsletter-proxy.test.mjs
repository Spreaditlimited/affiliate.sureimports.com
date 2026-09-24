import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const exports = {};
const source = fs.readFileSync(new URL('../proxy.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS}}).outputText;
new Function('exports', 'require', code)(exports, () => ({NextResponse: {
  next: () => ({status: 200}),
  json: (_, options) => ({status: options.status}),
  redirect: () => ({status: 307}),
}}));
test('production permits the public newsletter but retains protected-route guards', () => {
  const before = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const request = path => ({nextUrl: {pathname: path}, url: `https://affiliate.sureimports.com${path}`, cookies: {has: () => false}});
    assert.equal(exports.proxy(request('/api/sureimports-newsletter')).status, 200);
    assert.equal(exports.proxy(request('/api/payouts')).status, 401);
    assert.equal(exports.proxy(request('/api/account')).status, 401);
    assert.equal(exports.proxy(request('/dashboard')).status, 307);
    assert.equal(exports.proxy(request('/api/unknown')).status, 503);
  } finally {
    if (before === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = before;
  }
});
