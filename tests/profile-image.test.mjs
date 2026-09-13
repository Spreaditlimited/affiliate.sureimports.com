import test from 'node:test';
import assert from 'node:assert/strict';
import {isProfileImage,readProfileImage,MAX_PROFILE_IMAGE_BYTES} from '../lib/profile-image.ts';
test('only supported image signatures within the size cap are accepted',()=>{
 assert.equal(isProfileImage(Buffer.from([255,216,255,0])),true);
 assert.equal(isProfileImage(Buffer.from([137,80,78,71,13,10,26,10])),true);
 assert.equal(isProfileImage(Buffer.from('RIFF1234WEBP')),true);
 assert.equal(isProfileImage(Buffer.from('<svg onload="alert(1)"></svg>')),false);
 assert.equal(isProfileImage(Buffer.alloc(MAX_PROFILE_IMAGE_BYTES+1)),false);
 assert.equal(isProfileImage(Buffer.alloc(0)),false);
});
test('streaming uploads enforce limits without trusting Content-Length',async()=>{
 const bytes=Buffer.alloc(MAX_PROFILE_IMAGE_BYTES+1);
 await assert.rejects(readProfileImage(new Request('https://example.invalid',{method:'POST',body:bytes})),/2 MB/);
 await assert.rejects(readProfileImage(new Request('https://example.invalid',{method:'POST',body:'not an image'})),/JPEG/);
 const png=Buffer.from([137,80,78,71,13,10,26,10]);
 assert.deepEqual(await readProfileImage(new Request('https://example.invalid',{method:'POST',body:png})),png);
});
