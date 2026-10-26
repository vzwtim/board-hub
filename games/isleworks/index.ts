import type {GameDefinition,PlayerID} from '../../engine/types.ts';
export type Resource='wood'|'clay'|'grain';
export const RESOURCES:Resource[]=['wood','clay','grain'];
export const resourceName:Record<Resource,string>={wood:'木材',clay:'土',grain:'麦'};
export type Bag=Record<Resource,number>;
export interface Hex {id:number;q:number;r:number;resource:Resource;season:number}
export interface Road {a:number;b:number;owner:PlayerID}
export interface Site {tile:number;owner:PlayerID;level:1|2}
export type IslandAction={type:'harvest'}|{type:'road';a:number;b:number}|{type:'camp';tile:number}|{type:'upgrade';tile:number}|{type:'trade';give:Resource;take:Resource}|{type:'pass'};
export interface IslandBoard {tiles:Hex[];roads:Road[];sites:Site[];bags:Record<PlayerID,Bag>;phase:'harvest'|'build';actions:number;season:number;round:number;last:{type:IslandAction['type'];message:string;tiles:number[];gains:{player:PlayerID;resource:Resource;count:number;tile:number}[]}|null}
export function mapTiles():Hex[]{const t:Hex[]=[];for(let r=-2;r<=2;r++)for(let q=-2;q<=2;q++)if(Math.abs(q+r)<=2){let id=t.length;t.push({id,q,r,resource:RESOURCES[((q-r)%3+3)%3],season:(id*5+2)%6+1})}return t}
export const HOME0=()=>mapTiles().find(x=>x.q===-2&&x.r===0)!.id;
export const HOME1=()=>mapTiles().find(x=>x.q===2&&x.r===0)!.id;
export const COSTS={road:{wood:1,clay:1,grain:0},camp:{wood:1,clay:1,grain:1},upgrade:{wood:0,clay:2,grain:2}};
export const score=(b:IslandBoard,p:PlayerID)=>b.sites.filter(s=>s.owner===p).reduce((sum,s)=>sum+s.level,0);
export function neighbors(b:IslandBoard,a:number,c:number){const x=b.tiles[a],y=b.tiles[c];if(!x||!y)return false;const dq=x.q-y.q,dr=x.r-y.r;return Math.max(Math.abs(dq),Math.abs(dr),Math.abs(dq+dr))===1}
export function canPay(b:Bag,c:Bag){return RESOURCES.every(r=>b[r]>=c[r])}
export function reachable(b:IslandBoard,p:PlayerID){const set=new Set(b.sites.filter(s=>s.owner===p).map(s=>s.tile));let change=true;while(change){change=false;for(const road of b.roads.filter(r=>r.owner===p))for(const [a,c] of [[road.a,road.b],[road.b,road.a]])if(set.has(a)&&!set.has(c)&&!b.sites.some(s=>s.tile===a&&s.owner!==p)){set.add(c);change=true}}return set}
const endTurn=(b:IslandBoard,p:PlayerID)=>{b.phase='harvest';b.actions=2;b.round++;return p==='0'?'1':'0'};
export const isleworks:GameDefinition<IslandBoard,IslandAction>={
 id:'isleworks',version:'1.0.0',
 setup:()=>({tiles:mapTiles(),roads:[],sites:[{tile:HOME0(),owner:'0',level:1},{tile:HOME1(),owner:'1',level:1}],bags:{'0':{wood:4,clay:4,grain:3},'1':{wood:4,clay:4,grain:3}},phase:'harvest',actions:2,season:1,round:1,last:null}),
 validate(b,p,a){
  if(!a||typeof a!=='object')return '操作を選んでください';
  if(a.type==='harvest')return b.phase==='harvest'?null:'この手番の収穫は終わっています';
  if(b.phase!=='build')return 'まず季節を進めて収穫してください';
  if(a.type==='pass')return null;
  if(a.type==='trade'){if(!RESOURCES.includes(a.give)||!RESOURCES.includes(a.take)||a.give===a.take)return '異なる資源を選んでください';return b.bags[p][a.give]>=3?null:'交換には同じ資源が3個必要です'}
  if(!['road','camp','upgrade'].includes(a.type))return '対応していない操作です';
  if(b.actions<=0)return '建設アクションを使い切りました。手番を終了してください';
  if(!canPay(b.bags[p],COSTS[a.type]))return '資源が足りません';
  const connected=reachable(b,p);
  if(a.type==='road'){
   if(!Number.isInteger(a.a)||!Number.isInteger(a.b)||!neighbors(b,a.a,a.b))return '隣り合う土地を選んでください';
   if(b.roads.some(r=>(r.a===a.a&&r.b===a.b)||(r.a===a.b&&r.b===a.a)))return 'そこにはすでに道があります';
   if(![a.a,a.b].some(id=>connected.has(id)&&!b.sites.some(s=>s.tile===id&&s.owner!==p)))return '自分の拠点や道からつなげてください';return null;
  }
  if(!Number.isInteger(a.tile)||!b.tiles[a.tile])return '土地を選んでください';
  if(a.type==='camp'){if(b.sites.some(s=>s.tile===a.tile))return 'その土地にはすでに拠点があります';if(!connected.has(a.tile))return '自分の道が届く土地に建ててください';return null}
  return b.sites.some(s=>s.tile===a.tile&&s.owner===p&&s.level===1)?null:'自分の未発展の拠点を選んでください';
 },
 reduce(b,p,a){
  let nextPlayer=p;const gains:NonNullable<IslandBoard['last']>['gains']=[];let tiles:number[]=[],message='';
  if(a.type==='harvest'){
   b.season=(b.round-1)%6+1;for(const s of b.sites){const tile=b.tiles[s.tile];if(tile.season===b.season){b.bags[s.owner][tile.resource]+=s.level;gains.push({player:s.owner,resource:tile.resource,count:s.level,tile:s.tile});tiles.push(s.tile)}}
   const supply=RESOURCES[(b.season-1)%3];b.bags[p][supply]++;gains.push({player:p,resource:supply,count:1,tile:-1});b.phase='build';message=`季節${b.season}。一致する土地が生産し、手番の人に${resourceName[supply]}を1個補給。`;
  }else if(a.type==='pass'){nextPlayer=endTurn(b,p);message='手番を終了。次の季節へ。'}else if(a.type==='trade'){b.bags[p][a.give]-=3;b.bags[p][a.take]++;message=`${resourceName[a.give]}3個を${resourceName[a.take]}1個に交換。`}
  else{const cost=COSTS[a.type];for(const r of RESOURCES)b.bags[p][r]-=cost[r];b.actions--;if(a.type==='road'){b.roads.push({a:a.a,b:a.b,owner:p});tiles=[a.a,a.b];message='道がつながりました。新しい土地へ。'}if(a.type==='camp'){b.sites.push({tile:a.tile,owner:p,level:1});tiles=[a.tile];message='拠点を建設。+1点、収穫のチャンスも増えます。'}if(a.type==='upgrade'){b.sites.find(s=>s.tile===a.tile)!.level=2;tiles=[a.tile];message='拠点を工房に発展。+1点、生産量が2倍に。'}}
  b.last={type:a.type,message,tiles,gains};let winner:PlayerID|'draw'|undefined;
  if(score(b,p)>=6)winner=p;
  else if(b.round>40){const x=score(b,'0'),y=score(b,'1');winner=x===y?'draw':x>y?'0':'1';b.last.message+=' 40手番が終了。得点で決着。'}
  return {board:b,nextPlayer,winner};
 },playerView:b=>structuredClone(b)
};
export function legalActions(b:IslandBoard,p:PlayerID):IslandAction[]{if(b.phase==='harvest')return [{type:'harvest'}];const a:IslandAction[]=[{type:'pass'}];for(const t of b.tiles){a.push({type:'camp',tile:t.id},{type:'upgrade',tile:t.id});for(const u of b.tiles)if(u.id>t.id&&neighbors(b,t.id,u.id))a.push({type:'road',a:t.id,b:u.id})}for(const give of RESOURCES)for(const take of RESOURCES)a.push({type:'trade',give,take});return a.filter(x=>isleworks.validate(b,p,x)===null)}
export function chooseBotAction(b:IslandBoard,p:PlayerID):IslandAction{const a=legalActions(b,p);return a.find(x=>x.type==='harvest')||a.find(x=>x.type==='upgrade')||a.filter(x=>x.type==='camp').sort((x,y)=>x.type==='camp'&&y.type==='camp'?b.tiles[x.tile].season-b.tiles[y.tile].season:0)[0]||a.filter(x=>x.type==='road').find(x=>x.type==='road'&&[x.a,x.b].some(id=>!b.sites.some(s=>s.tile===id)&&!reachable(b,p).has(id)))||a.find(x=>x.type==='trade'&&b.bags[p][x.give]>=4&&b.bags[p][x.take]<2)||{type:'pass'}}
