import {createHmac,createSign,timingSafeEqual} from 'node:crypto';
import {RuleError} from '../../engine/types.ts';
import {repositoryInput,type CodeProject,type SourceFiles,type Repository} from './model.ts';
export interface GitHubConfig {appID?:string;privateKey?:string;webhookSecret?:string;managedRepository?:string;managedBranch?:string;installURL?:string}
export class CodeGitHub {
 private config:GitHubConfig; private request:typeof fetch;
 constructor(config:GitHubConfig,request:typeof fetch=fetch){this.config=config;this.request=request}
 ready(){return !!(this.config.appID&&this.config.privateKey)}
 private jwt(){if(!this.ready())throw new RuleError('SETUP','GitHub連携が未設定です。運営側の接続設定が必要です');const now=Math.floor(Date.now()/1000),b64=(v:unknown)=>Buffer.from(JSON.stringify(v)).toString('base64url'),data=b64({alg:'RS256',typ:'JWT'})+'.'+b64({iat:now-30,exp:now+300,iss:this.config.appID});return data+'.'+createSign('RSA-SHA256').update(data).sign(this.config.privateKey!.replaceAll('\\n','\n'),'base64url')}
 private async api(path:string,token:string,method='GET',body?:unknown):Promise<any>{const r=await this.request('https://api.github.com'+path,{method,headers:{Accept:'application/vnd.github+json',Authorization:'Bearer '+token,'X-GitHub-Api-Version':'2022-11-28','User-Agent':'BoardHub-Code-Platform',...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(12000)});if(!r.ok)throw new RuleError(r.status===404?'NOT_FOUND':'GITHUB','GitHubの接続権限・リポジトリ・ブランチを確認してください（'+r.status+'）');return r.status===204?null:r.json()}
 async installation(name:string){const installation=await this.api('/repos/'+name+'/installation',this.jwt());if(!Number.isSafeInteger(installation.id))throw new RuleError('GITHUB','GitHub Appの導入を確認できません');return installation.id as number}
 private async token(installation:number){const r=await this.api('/app/installations/'+installation+'/access_tokens',this.jwt(),'POST',{});return r.token as string}
 async read(repository:Repository){const token=await this.token(repository.installation),base='/repos/'+repository.fullName;const ref=await this.api(base+'/git/ref/heads/'+encodeURIComponent(repository.branch),token);const sha=ref.object.sha;if(!/^[a-f0-9]{40}$/.test(sha))throw new RuleError('GITHUB','コミットを確認できません');const commit=await this.api(base+'/git/commits/'+sha,token);const tree=await this.api(base+'/git/trees/'+commit.tree.sha+'?recursive=1',token);if(tree.truncated)throw new RuleError('LIMIT','リポジトリが大きすぎます。ゲーム用フォルダを分けてください');
 const prefix=repository.directory?repository.directory+'/':'';const rows=tree.tree.filter((x:any)=>x.type==='blob'&&x.path.startsWith(prefix)).map((x:any)=>({...x,path:x.path.slice(prefix.length)})).filter((x:any)=>!x.path.startsWith('.github/')&&!x.path.startsWith('node_modules/')&&!x.path.startsWith('.boardhub/')&&!x.path.startsWith('runtime/')&&!x.path.includes('/.env')&&!x.path.startsWith('.env')&&(/\.(ts|js|json|html|css|md|txt)$/.test(x.path)||['LICENSE','.gitignore'].includes(x.path)));
 if(rows.length>80||rows.some((x:any)=>x.mode!=='100644'&&x.mode!=='100755')||rows.reduce((n:number,x:any)=>n+(x.size||0),0)>400000)throw new RuleError('LIMIT','ソースの件数・サイズ・ファイル形式を確認してください');
 const files:SourceFiles=Object.create(null);for(let i=0;i<rows.length;i+=6)await Promise.all(rows.slice(i,i+6).map(async(row:any)=>{const blob=await this.api(base+'/git/blobs/'+row.sha,token);if(blob.encoding!=='base64')throw new RuleError('GITHUB','ソースを読み取れません');files[row.path]=Buffer.from(blob.content,'base64').toString('utf8')}));return {files,commit:sha,tree:commit.tree.sha};
 }
 async connect(project:CodeProject,input:unknown):Promise<Repository>{const c=repositoryInput(input),installation=await this.installation(c.fullName),repository={...c,installation,managed:false};const {files}=await this.read(repository);let proof;try{proof=JSON.parse(files['boardhub-link.json'])}catch{throw new RuleError('INPUT','接続ファイル boardhub-link.json をゲームのフォルダに追加してください')};if(proof.project!==project.id||proof.challenge!==project.challenge)throw new RuleError('UNAUTHORIZED','この作品用の接続ファイルをGitHubへ追加してください');return repository}
 async managed(project:CodeProject):Promise<Repository>{if(!this.config.managedRepository)throw new RuleError('SETUP','アップロード用のGitHub保存先が未設定です');const c=repositoryInput({fullName:this.config.managedRepository,branch:this.config.managedBranch||'main',directory:'projects/'+project.id});const installation=await this.installation(c.fullName),metadata=await this.api('/repos/'+c.fullName,await this.token(installation));if(metadata.private!==true)throw new RuleError('SETUP','アップロード保存先には非公開のGitHubリポジトリを設定してください');return {...c,installation,managed:true}}
 async upload(repository:Repository,files:SourceFiles,previous:SourceFiles={}){
 const token=await this.token(repository.installation),base='/repos/'+repository.fullName;
 const ref=await this.api(base+'/git/ref/heads/'+encodeURIComponent(repository.branch),token),parent=ref.object.sha;
 const commit=await this.api(base+'/git/commits/'+parent,token),prefix=repository.directory?repository.directory+'/':'';
 const entries:any[]=Object.entries(files).map(([path,content])=>({path:prefix+path,mode:'100644',type:'blob',content}));
 for(const path of Object.keys(previous))if(!(path in files))entries.push({path:prefix+path,mode:'100644',type:'blob',sha:null});
 const tree=await this.api(base+'/git/trees',token,'POST',{base_tree:commit.tree.sha,tree:entries});
 const next=await this.api(base+'/git/commits',token,'POST',{message:'BoardHub: update game source',tree:tree.sha,parents:[parent]});
 await this.api(base+'/git/refs/heads/'+encodeURIComponent(repository.branch),token,'PATCH',{sha:next.sha,force:false});return next.sha as string;
 }
}
export function verifyWebhook(secret:string|undefined,body:string,signature:string|null){if(!secret||!signature||!/^sha256=[a-f0-9]{64}$/.test(signature))return false;const actual=createHmac('sha256',secret).update(body).digest('hex');return timingSafeEqual(Buffer.from(actual),Buffer.from(signature.slice(7)))}
