import test from 'node:test';
import assert from 'node:assert/strict';
import {validateAvatar} from '../server/avatar.ts';
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=';
test('avatar accepts a compact PNG and explicit removal',()=>{assert.equal(validateAvatar(png),png);assert.equal(validateAvatar(''),'')});
test('avatar rejects URLs, SVG, invalid content and oversized dimensions',()=>{for(const input of [null,'https://example.com/a.png','data:image/svg+xml;base64,PHN2Zz4=', 'data:image/png;base64,YWJj',png+'A'.repeat(90000)])assert.throws(()=>validateAvatar(input));const bytes=Buffer.from(png.slice(22),'base64');bytes.writeUInt32BE(129,16);assert.throws(()=>validateAvatar('data:image/png;base64,'+bytes.toString('base64')))});
