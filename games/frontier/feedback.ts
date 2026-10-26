import {RES,type Res} from './topology.ts';
import type {Action,Board,Seat} from './index.ts';
export type ResourcePoint={kind:'player';id:Seat}|{kind:'tile'|'vertex'|'edge';id:number}|{kind:'bank'};
export interface ResourceFlow{from:ResourcePoint;to:ResourcePoint;resource?:Res;count:number;visibleTo?:Seat[]}
export const feedbackSnapshot=(b:Board)=>({bags:structuredClone(b.bags),bank:{...b.bank},offer:b.offer?structuredClone(b.offer):null});
/** Actual settled transfers only. Proposals and unavailable production emit nothing. */
export function resourceFlows(before:ReturnType<typeof feedbackSnapshot>,b:Board,p:Seat,a:Action):ResourceFlow[]{const flows:ResourceFlow[]=[],seat=(id:Seat):ResourcePoint=>({kind:'player',id}),bank:ResourcePoint={kind:'bank'};
 const add=(from:ResourcePoint,to:ResourcePoint,resource:Res,count:number,visibleTo?:Seat[])=>{if(count>0)flows.push({from,to,resource,count,...(visibleTo?{visibleTo}:{})})};
 const delta=(q:Seat,r:Res)=>b.bags[q][r]-before.bags[q][r];
 if(a.type==='roll'||a.type==='place'){const remaining=Object.fromEntries(RES.map(r=>[r,Math.max(0,delta(p,r))])) as Record<Res,number>;const tiles=a.type==='roll'?b.tiles.filter(t=>t.number===a.dice[0]+a.dice[1]&&t.id!==b.robber&&t.resource):b.vertices[a.vertex].tiles.map(id=>b.tiles[id]);for(const t of tiles){const r=t.resource;if(!r)continue;if(a.type==='place'){if(remaining[r]>0){add({kind:'tile',id:t.id},seat(p),r,1);remaining[r]--}}else for(const site of b.sites)if(t.vertices.includes(site.vertex)&&delta(site.owner,r)>0)add({kind:'tile',id:t.id},seat(site.owner),r,site.level)}}
 else if(['road','camp','city','buy'].includes(a.type)){const to:ResourcePoint=a.type==='road'?{kind:'edge',id:a.edge}:a.type==='camp'||a.type==='city'?{kind:'vertex',id:a.vertex}:bank;for(const r of RES)add(seat(p),to,r,-delta(p,r))}
 else if(a.type==='bank'||a.type==='bank-bundle'||a.type==='discard'){for(const r of RES){add(seat(p),bank,r,-delta(p,r),a.type==='discard'?[p]:undefined);add(bank,seat(p),r,delta(p,r))}}
 else if(a.type==='respond'&&a.accept&&before.offer){const o=before.offer;for(const r of RES){add(seat(o.maker),seat(o.to),r,o.give[r]);add(seat(o.to),seat(o.maker),r,o.take[r])}}
 else if(a.type==='robber'||a.type==='card'){for(const r of RES){for(const q of Object.keys(before.bags) as Seat[])if(q!==p)add(seat(q),seat(p),r,-delta(q,r),a.type==='robber'?[p,q]:undefined);if(a.type==='card')add(bank,seat(p),r,Math.max(0,before.bank[r]-b.bank[r]))}}
 return flows;
}
/** Hide private resource kinds and merge hidden discards so category counts cannot leak. */
export function visibleResourceFlows(flows:ResourceFlow[]=[],viewer:Seat|null,reveal=false):ResourceFlow[]{const out:ResourceFlow[]=[];for(const f of flows){const {visibleTo,...publicFlow}=f;if(!reveal&&visibleTo&&!visibleTo.includes(viewer as Seat)){const {resource,...hidden}=publicFlow;const key=JSON.stringify([hidden.from,hidden.to]);const prior=out.find(x=>x.resource===undefined&&JSON.stringify([x.from,x.to])===key);if(prior)prior.count+=hidden.count;else out.push(hidden)}else out.push(publicFlow)}return out}
export function resourceDeltas(flows:ResourceFlow[],p:Seat){const bag:Partial<Record<Res|'hidden',number>>={};for(const f of flows){const sign=(f.to.kind==='player'&&f.to.id===p?1:0)-(f.from.kind==='player'&&f.from.id===p?1:0);if(sign){const r=f.resource||'hidden';bag[r]=(bag[r]||0)+sign*f.count}}return Object.entries(bag).filter(([,n])=>n!==0) as [Res|'hidden',number][]}
export const feedbackDuration=(b:Board)=>b.last.flows?.length?1450:650;
