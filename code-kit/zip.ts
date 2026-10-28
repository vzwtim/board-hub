const encoder=new TextEncoder();
function crc32(data:Uint8Array){let crc=0xffffffff;for(const byte of data){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0)}return (crc^0xffffffff)>>>0}
/** Small dependency-free, stored ZIP writer for the fixed UTF-8 source kit. */
export function sourceZip(files:Record<string,string>):Uint8Array<ArrayBuffer> {
 const entries=Object.entries(files).sort(([a],[b])=>a.localeCompare(b)).map(([path,text])=>{
  if(!path||path.startsWith('/')||path.includes('\\')||path.split('/').some(p=>!p||p==='.'||p==='..'))throw Error('Invalid archive path');
  const name=encoder.encode(path),data=encoder.encode(text);
  if(name.length>65535||data.length>4*1024*1024)throw Error('Archive entry too large');
  return {name,data,crc:crc32(data),offset:0};
 });
 if(entries.length>65535)throw Error('Too many archive entries');
 const size=entries.reduce((n,e)=>n+30+e.name.length+e.data.length+46+e.name.length,22);
 if(size>16*1024*1024)throw Error('Archive too large');
 const bytes=new Uint8Array(size),view=new DataView(bytes.buffer);let offset=0;
 for(const e of entries){e.offset=offset;view.setUint32(offset,0x04034b50,true);view.setUint16(offset+4,20,true);view.setUint16(offset+6,0x800,true);view.setUint16(offset+12,33,true);view.setUint32(offset+14,e.crc,true);view.setUint32(offset+18,e.data.length,true);view.setUint32(offset+22,e.data.length,true);view.setUint16(offset+26,e.name.length,true);bytes.set(e.name,offset+30);bytes.set(e.data,offset+30+e.name.length);offset+=30+e.name.length+e.data.length}
 const central=offset;
 for(const e of entries){view.setUint32(offset,0x02014b50,true);view.setUint16(offset+4,20,true);view.setUint16(offset+6,20,true);view.setUint16(offset+8,0x800,true);view.setUint16(offset+14,33,true);view.setUint32(offset+16,e.crc,true);view.setUint32(offset+20,e.data.length,true);view.setUint32(offset+24,e.data.length,true);view.setUint16(offset+28,e.name.length,true);view.setUint32(offset+42,e.offset,true);bytes.set(e.name,offset+46);offset+=46+e.name.length}
 view.setUint32(offset,0x06054b50,true);view.setUint16(offset+8,entries.length,true);view.setUint16(offset+10,entries.length,true);view.setUint32(offset+12,offset-central,true);view.setUint32(offset+16,central,true);
 return bytes;
}
