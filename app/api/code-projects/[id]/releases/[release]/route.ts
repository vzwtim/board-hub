import {codeStore} from '../../../../../../server/code-platform/store.ts';
import {runtimeLoader} from '../../../../../../server/code-platform/config.ts';
import {sandboxCall} from '../../../../../../server/code-platform/compiler.ts';
import {response,error} from '../../../../../../server/http.ts';
import {RuleError} from '../../../../../../engine/types.ts';
export async function GET(r:Request,{params}:{params:Promise<{id:string;release:string}>}){try{const {id,release}=await params,p=await codeStore.getProject(id),record=await codeStore.getRelease(id,release);if(!p||!record||record.status!=='ready')throw new RuleError('NOT_FOUND','試遊できる版が見つかりません');const metadata=await sandboxCall(runtimeLoader(),record,{type:'metadata'});return response({project:{id:p.id,title:record.title,author:p.author},release:record.id,digest:record.digest,ui:record.ui,metadata})}catch(e){return error(e)}}
