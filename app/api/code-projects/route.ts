import {ensureDraft} from '../../../server/code-platform/creator.ts';
import {draftStore} from '../../../server/code-platform/store.ts';
import {codeStore} from '../../../server/code-platform/store.ts';
import {createCodeProject,publicProject} from '../../../server/code-platform/model.ts';
import {capabilities} from '../../../server/code-platform/config.ts';
import {requireIdentity} from '../../../server/project-auth.ts';
import {codeBody} from '../../../server/code-platform/http.ts';
import {getProject} from '../../../server/project-model.ts';
import {projectStore} from '../../../server/project-store.ts';
import {RuleError} from '../../../engine/types.ts';
import {compileLocalPreview} from '../../../server/code-platform/local-preview.ts';
import {communityCodeFiles} from '../../../server/code-platform/community-import.ts';
import {response,error} from '../../../server/http.ts';
export async function GET(r:Request){try{const community=new URL(r.url).searchParams.get('scope')==='community';const u=community?null:await requireIdentity(r);return response({projects:(await codeStore.listProjects(u?.id||null)).map(p=>community?publicProject(p):p),capabilities:capabilities()})}catch(e){return error(e)}}
export async function POST(r:Request) {
  try {
    const user=await requireIdentity(r),input=await codeBody(r);
    if(input.legacy!==undefined) {
      if(typeof input.legacy!=='string'||typeof input.version!=='string')throw new RuleError('INPUT','取り込む作品と版を選んでください');
      const legacy=await getProject(projectStore,input.legacy,user);
      if(legacy.owner!==user.id)throw new RuleError('UNAUTHORIZED','自分の作品を選んでください');
      const version=legacy.versions.find(v=>v.id===input.version)
        ??legacy.proposals.find(v=>v.id===input.version);
      if(!version)throw new RuleError('NOT_FOUND','取り込む版が見つかりません');
      const files=communityCodeFiles(version.spec,{id:legacy.id,version:version.id,author:legacy.author});
      compileLocalPreview(files);
      const project=await createCodeProject(codeStore,user,version.spec.title,{revision:1,files,summary:'以前の作品から選んだ版をコピーしました',updatedAt:Date.now()});
      return response(project,201);
    }
    const project=await createCodeProject(codeStore,user,input.title);
    await ensureDraft(codeStore,draftStore,project.id,user.id);
    return response(project,201);
  } catch(e) {
    return error(e);
  }
}
