import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
globalThis.__feedbackCalls=[];
const hook=registerHooks({resolve(s,c,n){if(s==='sonner')return {url:'data:text/javascript,'+encodeURIComponent("export const toast=Object.fromEntries(['success','error'].map(tone=>[tone,(title,options)=>globalThis.__feedbackCalls.push({tone,title,...options})]));"),shortCircuit:true};return n(s,c)}});
const {notify}=await import('../lib/useToastNotice.ts');hook.deregister();
test('feedback uses explicit tones, preserves descriptions, allows retries and ignores clearing',()=>{
 notify('success','Bank account saved.');notify('error','The email code is incorrect. Request a new code.');notify('error','The email code is incorrect. Request a new code.');notify('success','');
 const calls=globalThis.__feedbackCalls;assert.equal(calls.length,3);assert.equal(calls[0].tone,'success');assert.equal(calls[0].description,'Bank account saved.');assert.equal(calls[1].tone,'error');assert.equal(calls[1].duration,10000);assert.equal(calls[1].title,'Action failed');
});
