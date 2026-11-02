import ts from 'typescript';
import {compileCode} from './compiler.ts';

// Compilation only: author code is executed in a disposable browser Worker,
// never in the application server or with its credentials.
export function compileLocalPreview(files:unknown){
 const compiled=compileCode(files),modules:Record<string,string>={};
 for(const [path,value] of Object.entries(compiled.modules)){
  modules[path]='json' in value?'module.exports='+JSON.stringify(value.json)+';':ts.transpileModule(value.js,{fileName:path,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
 }
 return {digest:compiled.digest,title:compiled.title,ui:compiled.ui,modules};
}
