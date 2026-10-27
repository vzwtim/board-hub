export const RETURN_KEY='boardhub-return-to';
export function libraryDestination(value:string,origin:string){if(!value.trim())return null;try{const u=new URL(value,origin);if(u.origin!==origin)return null;if(!['/','/community','/account'].includes(u.pathname)&&!/^\/games\/[a-f0-9-]{36}$/.test(u.pathname))return null;return u.pathname+u.search}catch{return null}}
export function gameMenuURL(path:string,search:string){const q=new URLSearchParams(search);for(const key of ['room','join','mode','resume','guide'])q.delete(key);return path+(q.size?'?'+q:'')}
export function localGameURL(path:string,search:string,mode:string){const u=new URL(gameMenuURL(path,search),'https://boardhub.invalid');u.searchParams.set('mode',mode);return u.pathname+u.search}
