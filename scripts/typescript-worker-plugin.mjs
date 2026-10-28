// transpileModule only needs the compiler's in-memory API. Disable Node filesystem
// discovery so the same dependency can run under nodejs_compat in Workers.
export function workerTypeScriptSource(code){
 const marker='function isNodeLikeSystem() {';
 if(!code.includes(marker))throw Error('TypeScript runtime layout changed; review Worker compiler adapter');
 return code.replace(marker,marker+'\n  return false; // BoardHub: no filesystem access in the compiler\n');
}
export function typescriptWorkerPlugin(){return {name:'boardhub-typescript-worker',enforce:'pre',transform(code,id){if(/\/typescript\/lib\/typescript\.js(?:\?.*)?$/.test(id))return {code:workerTypeScriptSource(code),map:null}}}}
