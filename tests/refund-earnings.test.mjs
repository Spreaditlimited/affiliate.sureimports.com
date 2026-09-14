import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const root=new URL('../',import.meta.url);
function loadOverview() {
 const exports={};
 const prisma={affiliate_conversions:{groupBy:async()=>[
  {commissionCurrency:'USD',status:'AVAILABLE',_sum:{commissionAmount:20}},
  {commissionCurrency:'USD',status:'PENDING',_sum:{commissionAmount:10}},
 ],count:async()=>1,findMany:async()=>[{id:1,pidConversion:'ONE',service:{displayName:'Procurement'},sourceEventKey:null,externalOrderReference:'procurement:ONE',paymentCurrency:'USD',grossAmount:100,commissionCurrency:'USD',commissionAmount:20,status:'AVAILABLE',createdAt:new Date(0)}]},affiliate_payouts:{groupBy:async()=>[{currency:'USD',_sum:{amount:16}}]}};
 const dependencies={'server-only':{},'@/lib/prisma':{prisma},'@/lib/payouts':{},'@/lib/refunds/affiliate-balances':{refundCommissionDeductions:async()=> (_currency,bucket='AVAILABLE')=>bucket==='PENDING'?2:4,refundDeductionsByConversion:async()=>new Map([[1,4]])}};
 new Function('exports','require',ts.transpileModule(fs.readFileSync(new URL('lib/dashboard/overview.ts',root),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(exports,name=>dependencies[name]);
 return exports;
}
test('earnings balances, row deductions and payout progress remain distinct',async()=>{
 const data=await loadOverview().getEarningsData(42);
 assert.equal(data.totals.find(x=>x.status==='AVAILABLE').amount,16);
 assert.equal(data.totals.find(x=>x.status==='PENDING').amount,8);
 assert.equal(data.conversions[0].originalCommission,20);
 assert.equal(data.conversions[0].refundDeduction,4);
 assert.equal(data.conversions[0].commissionAmount,16);
 assert.equal(data.processing[0].amount,16);
});
test('earnings CSV explains deductions instead of silently replacing original amounts',()=>{
 const source=fs.readFileSync(new URL('app/api/exports/[dataset]/route.ts',root),'utf8');
 assert.match(source,/'Net commission'/);assert.match(source,/'Original commission'/);assert.match(source,/'Refund deduction'/);
});
