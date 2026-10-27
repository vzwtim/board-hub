export type ClientRoomIdentity={kind:'account'|'guest';id:string};
type StorageLike=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
export class RoomSeatStorage{
 private memory=new Map<string,string>();
 private tab:StorageLike|null;private browser:StorageLike|null;
 constructor(tab:StorageLike|null,browser:StorageLike|null){this.tab=tab;this.browser=browser}
 private read(key:string,shared=false){try{return (shared?this.browser:this.tab)?.getItem(key)||this.memory.get(key)||''}catch{return this.memory.get(key)||''}}
 private write(key:string,value:string,shared=false){this.memory.set(key,value);try{(shared?this.browser:this.tab)?.setItem(key,value)}catch{}}
 private roomKey(api:string,id:string){return 'boardhub-room-identity-v2:'+api+':'+id}
 identity(api:string,id:string,accountId?:string):ClientRoomIdentity{try{const saved=JSON.parse(this.read(this.roomKey(api,id))||'null');if(saved?.kind==='guest'&&typeof saved.id==='string')return saved;if(saved?.kind==='account'&&saved.id===accountId)return saved}catch{}if(accountId)return {kind:'account',id:accountId};let guest=this.read('boardhub-tab-guest-v2');if(!guest){guest=crypto.randomUUID();this.write('boardhub-tab-guest-v2',guest)}return {kind:'guest',id:guest}}
 private key(api:string,id:string,identity:ClientRoomIdentity){return 'boardhub-seat-v2:'+api+':'+id+':'+identity.kind+':'+identity.id}
 token(api:string,id:string,identity:ClientRoomIdentity){return this.read(this.key(api,id,identity),identity.kind==='account')||this.read(this.key(api,id,identity))}
 save(api:string,id:string,identity:ClientRoomIdentity,token=''){this.write(this.roomKey(api,id),JSON.stringify(identity));if(token)this.write(this.key(api,id,identity),token,identity.kind==='account')}
 // Only non-invite resumes migrate old capabilities. Public invite URLs never load them.
 legacy(api:string,id:string,identity:ClientRoomIdentity){const key=api==='/api/rooms'?'openboard-seat-'+id:'table-seat-'+api+'-'+id;let value='';try{value=this.browser?.getItem(key)||this.tab?.getItem(key)||''}catch{}if(value){this.save(api,id,identity,value);try{this.browser?.removeItem(key);this.tab?.removeItem(key)}catch{}}return value}
}
