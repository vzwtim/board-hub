import {RuleError} from '../../engine/types.ts';
import {validateFiles,requireProject,saveProject,type CodeStore} from './model.ts';
import {CodeGitHub} from './github.ts';
import {prepareRelease} from './releases.ts';
import type {SandboxLoader} from './compiler.ts';
export async function sourceOperation(store:CodeStore,github:CodeGitHub,loader:SandboxLoader|undefined,id:string,owner:string,input:any){
 const p=await requireProject(store,id,owner);if(input.expectedRevision!==p.revision)throw new RuleError('STALE_STATE','作品が更新されています。再読み込みしてください');
 if(input.type==='connect'){
  if(p.repository)throw new RuleError('STATE','すでに接続済みです。更新の取り込みを使ってください');
  const repository=await github.connect(p,input.repository);const others=await store.repositoryProjects(repository.fullName);if(others.some(x=>x.id!==p.id&&x.repository?.directory===repository.directory))throw new RuleError('CONFLICT','このフォルダは別の作品に接続されています');
  p.repository=repository;await saveProject(store,p,p.revision);
  const source=await github.read(repository);const release=await prepareRelease(store,loader,id,owner,source.files,{kind:'github',commit:source.commit});return {project:p,release};
 }
 if(input.type==='pull'){
  if(!p.repository)throw new RuleError('STATE','先にGitHubを接続してください');const source=await github.read(p.repository);const release=await prepareRelease(store,loader,id,owner,source.files,{kind:'github',commit:source.commit});return {project:p,release};
 }
 if(input.type==='upload'){
  const files=validateFiles(input.files);files['boardhub-link.json']=JSON.stringify({project:p.id,challenge:p.challenge});validateFiles(files);const repository=p.repository||await github.managed(p);
  const previous=(await store.listReleases(id))[0];const previousFiles=previous?(await store.getRelease(id,previous.id))?.files||{}:{};
  const commit=await github.upload(repository,files,previousFiles);
  if(!p.repository){p.repository=repository;await saveProject(store,p,p.revision)}
  const release=await prepareRelease(store,loader,id,owner,files,{kind:'upload',commit});return {project:p,release};
 }
 throw new RuleError('INPUT','取り込み方法を選んでください');
}
export async function processPush(store:CodeStore,github:CodeGitHub,loader:SandboxLoader|undefined,event:any){
 if(event.deleted||typeof event.repository?.full_name!=='string'||typeof event.ref!=='string'||!event.ref.startsWith('refs/heads/'))return;
 const projects=await store.repositoryProjects(event.repository.full_name);
 for(const p of projects){const r=p.repository;if(!r||r.installation!==event.installation?.id||'refs/heads/'+r.branch!==event.ref)continue;const changed=Array.isArray(event.commits)?event.commits.flatMap((c:any)=>[...(c.added||[]),...(c.modified||[]),...(c.removed||[])]):[];if(r.directory&&changed.length&&!event.forced&&!changed.some((path:unknown)=>typeof path==='string'&&path.startsWith(r.directory+'/')))continue;const source=await github.read(r);await prepareRelease(store,loader,p.id,p.owner,source.files,{kind:'github',commit:source.commit})}
}
