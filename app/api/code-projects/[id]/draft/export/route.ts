import {codeStore,draftStore} from '../../../../../../server/code-platform/store.ts';
import {ensureDraft} from '../../../../../../server/code-platform/creator.ts';
import {sourceFingerprint} from '../../../../../../server/code-platform/handoff.ts';
import {developmentBrief} from '../../../../../../lib/code-handoff.ts';
import {sourceZip} from '../../../../../../code-kit/zip.ts';
import {requireIdentity} from '../../../../../../server/project-auth.ts';
import {error} from '../../../../../../server/http.ts';
export async function GET(r:Request,{params}:{params:Promise<{id:string}>}){try{
 const u=await requireIdentity(r),{id}=await params,draft=await ensureDraft(codeStore,draftStore,id,u.id),project=(await codeStore.getProject(id))!;
 return new Response(sourceZip({...draft.files,'BOARDHUB_REQUEST.md':developmentBrief(project.title,draft.request||'',draft.revision),'boardhub-review.json':JSON.stringify({schema:1,project:id,baseDigest:sourceFingerprint(draft.files)},null,2)}),{headers:{'Content-Type':'application/zip','Content-Disposition':'attachment; filename="boardhub-development-kit.zip"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}catch(e){return error(e)}}
