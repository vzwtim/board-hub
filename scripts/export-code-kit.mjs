import {readFile,mkdir,writeFile,access} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const repo=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=resolve(process.argv[2]||join(repo,'outputs/isleworks-code-kit'));
try{await access(out);throw Error('Output already exists; choose an empty new destination: '+out)}catch(e){if(e.code!=='ENOENT')throw e}
// Load the same raw sources as the download endpoint, without a Vite dependency.
const bundle=await readFile(join(repo,'code-kit/bundle.ts'),'utf8');
const imports=[...bundle.matchAll(/import (\w+) from '([^']+)\?raw';/g)];
const values={};for(const [,name,path] of imports)values[name]=await readFile(resolve(repo,'code-kit',path),'utf8');
const source=bundle.replace(/^import .*;\n/gm,'').replace('export function isleworksFiles():Record<string,string>','function isleworksFiles()');
const files=Function(...Object.keys(values),source+'\nreturn isleworksFiles();')(...Object.values(values));
await mkdir(out,{recursive:true});for(const [path,content] of Object.entries(files)){const dest=join(out,path);await mkdir(dirname(dest),{recursive:true});await writeFile(dest,content)}
console.log('Exported '+Object.keys(files).length+' files to '+out+'\nRun: cd '+out+' && npm test && npm start');
