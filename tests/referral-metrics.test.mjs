import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const root=new URL('../',import.meta.url);
function overview({visits=5,referrals=2,purchasers=1,purchases=3}={}) {
  const calls=[];
  const db={
    affiliate_referrals:{count:async args=>{calls.push(args);return args.where.conversions?purchasers:args.where.customerReference?referrals:visits;},findMany:async args=>{calls.push(args);return []; }},
    affiliate_conversions:{count:async()=>purchases,groupBy:async()=>[],findMany:async()=>[]},
    affiliate_payouts:{groupBy:async()=>[]},affiliate_program_services:{findMany:async()=>[]},affiliate_payout_accounts:{count:async()=>0},
  };
  const deps={'server-only':{},'@/lib/prisma':{prisma:db},'@/lib/payouts':{},'@/lib/refunds/affiliate-balances':{refundCommissionDeductions:async()=>()=>0,refundDeductionsByConversion:async()=>new Map()}};
  const exports={};
  new Function('exports','require',ts.transpileModule(fs.readFileSync(new URL('lib/dashboard/overview.ts',root),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(exports,name=>deps[name]);
  return {...exports,calls};
}
test('five anonymous visits are never reported as five referrals',async()=>{
  const data=await overview({referrals:0,purchasers:0,purchases:0}).getDashboardOverview(31);
  assert.equal(data.linkVisits,5);assert.equal(data.totalReferrals,0);assert.equal(data.conversionRate,0);
});
test('repeat purchases cannot inflate the customer conversion rate',async()=>{
  const data=await overview().getDashboardOverview(31);
  assert.equal(data.linkVisits,5);assert.equal(data.totalReferrals,2);assert.equal(data.conversions,3);assert.equal(data.purchasingReferrals,1);assert.equal(data.conversionRate,50);
});
test('referral table and pagination exclude anonymous visits',async()=>{
  const api=overview({visits:100,referrals:1});const data=await api.getReferralData(31,99);
  assert.equal(data.total,1);assert.equal(data.linkVisits,100);assert.equal(data.page,1);
  const list=api.calls.find(call=>call.take);
  assert.deepEqual(list.where,{affiliateId:31,customerReference:{not:null}});
  assert.equal(api.calls.filter(call=>call.where.conversions)[0].where.customerReference.not,null);
  assert.deepEqual(api.calls[0].where.OR,[{source:null},{source:{not:'LINESCOUT'}}]);
});
test('labels and CSV exports agree with the registered-customer boundary',()=>{
  const home=fs.readFileSync(new URL('app/(dashboard)/dashboard/page.tsx',root),'utf8');
  assert.match(home,/<span>Link visits<\/span>/);assert.match(home,/data.totalReferrals/);assert.doesNotMatch(home,/totalClicks/);
  const csv=fs.readFileSync(new URL('app/api/exports/[dataset]/route.ts',root),'utf8');
  assert.match(csv,/affiliate_referrals.findMany\(\{\s*where: \{ affiliateId: affiliate.id, customerReference: \{ not: null \}/);
  assert.doesNotMatch(csv,/'Visited'/);
});
