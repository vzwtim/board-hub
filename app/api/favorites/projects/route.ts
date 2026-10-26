import {database,userIdentity} from '../../../../server/account-store.ts';
import {body,response,error} from '../../../../server/http.ts';
import {summary,type Project} from '../../../../server/project-model.ts';
import {RuleError} from '../../../../engine/types.ts';
export async function POST(r:Request){try{const user=await userIdentity(r),data=await body(r);if(!Array.isArray(data.ids)||data.ids.length>80||data.ids.some((id:unknown)=>typeof id!=='string'||!/^[a-f0-9-]{36}$/.test(id)))throw new RuleError('INPUT','お気に入りの指定が不正です');if(!data.ids.length)return response({projects:[]});const rows=await database().prepare(`SELECT snapshot FROM table_projects WHERE id IN (${data.ids.map(()=>'?').join(',')}) AND (listed=1 OR owner=?)`).bind(...data.ids,user?.id||'').all<{snapshot:string}>();return response({projects:rows.results.map(x=>summary(JSON.parse(x.snapshot) as Project))})}catch(e){return error(e)}}
