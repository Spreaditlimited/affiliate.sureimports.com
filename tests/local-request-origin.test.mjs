import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
const hooks=registerHooks({resolve(s,c,next){
  if(s==='server-only'||s==='@/lib/security/crypto')return {url:'data:text/javascript,export const secureFingerprint=()=>"unused"',shortCircuit:true};
  return next(s,c);
}});
const {isTrustedRequest}=await import('../lib/auth/request.ts');
hooks.deregister();
const request=(origin,host='localhost:3002',extra={})=>new Request('http://0.0.0.0:3002/api/auth/sign-in',{headers:{origin,host,...extra}});
test('development accepts exact browser host and port despite Next bind address',()=>{
  const previous=process.env.NODE_ENV;process.env.NODE_ENV='development';
  try {
    assert.equal(isTrustedRequest(request('http://localhost:3002')),true);
    assert.equal(isTrustedRequest(request('http://127.0.0.1:3002','127.0.0.1:3002')),true);
    assert.equal(isTrustedRequest(request('http://[::1]:3002','[::1]:3002')),true);
    for(const origin of ['http://localhost:3001','https://localhost:3002','http://0.0.0.0:3002','https://evil.example','null'])assert.equal(isTrustedRequest(request(origin)),false);
    assert.equal(isTrustedRequest(request('http://localhost:3002','localhost:3002',{'sec-fetch-site':'cross-site'})),false);
    assert.equal(isTrustedRequest(request('https://evil.example','localhost:3002',{'x-forwarded-host':'evil.example'})),false);
  } finally {if(previous===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=previous;}
});
test('production keeps exact request origin verification',()=>{
  const previous=process.env.NODE_ENV;process.env.NODE_ENV='production';
  try {
    assert.equal(isTrustedRequest(request('http://localhost:3002')),false);
    const url='https://affiliate.sureimports.com/api/auth/sign-in';
    assert.equal(isTrustedRequest(new Request(url,{headers:{origin:'https://affiliate.sureimports.com'}})),true);
    assert.equal(isTrustedRequest(new Request(url,{headers:{origin:'https://evil.example'}})),false);
  } finally {if(previous===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=previous;}
});
