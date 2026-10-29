import {isleworksFiles} from '../../code-kit/bundle.ts';
import {requireProject,type CodeStore} from './model.ts';
import type {DraftStore,CodeDraft} from './drafts.ts';
export async function ensureDraft(store:CodeStore,drafts:DraftStore,id:string,owner:string){const p=await requireProject(store,id,owner);const current=await drafts.get(id);if(current)return current;
 const releases=await store.listReleases(id),latest=releases[0]?await store.getRelease(id,releases[0].id):null;
 const files=latest?structuredClone(latest.files):isleworksFiles();delete files['runtime/server.mjs'];
 if(!latest){const manifest=JSON.parse(files['manifest.json']);manifest.title=p.title;manifest.forkOf={id:'frontier',version:'2.0.0',author:'BoardHub'};files['manifest.json']=JSON.stringify(manifest,null,2)+'\n'}
 const draft:CodeDraft={project:id,revision:1,files,summary:latest?'取り込んだ版から制作を再開':'島の工房を元に、あなたの作品を用意しました',updatedAt:Date.now()};await drafts.create(draft);return (await drafts.get(id))!;
}
