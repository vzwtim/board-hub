import {env} from 'cloudflare:workers';
import type {CodeStore,CodeProject,CodeRelease} from './model.ts';
const db=()=>env.DB!;
export const codeStore:CodeStore={
 async getProject(id){const r=await db().prepare('SELECT snapshot FROM code_projects WHERE id=?').bind(id).first<{snapshot:string}>();return r?JSON.parse(r.snapshot):null},
 async createProject(p){await db().prepare('INSERT INTO code_projects(id,owner,repository,listed,revision,updated_at,snapshot) VALUES(?,?,?,?,?,?,?)').bind(p.id,p.owner,p.repository?.fullName.toLowerCase()||'',+p.listed,p.revision,p.updatedAt,JSON.stringify(p)).run()},
 async replaceProject(p,revision){const r=await db().prepare('UPDATE code_projects SET owner=?,repository=?,listed=?,revision=?,updated_at=?,snapshot=? WHERE id=? AND revision=?').bind(p.owner,p.repository?.fullName.toLowerCase()||'',+p.listed,p.revision,p.updatedAt,JSON.stringify(p),p.id,revision).run();return r.meta.changes===1},
 async listProjects(owner){const r=await (owner?db().prepare('SELECT snapshot FROM code_projects WHERE owner=? ORDER BY updated_at DESC LIMIT 20').bind(owner):db().prepare('SELECT snapshot FROM code_projects WHERE listed=1 ORDER BY updated_at DESC LIMIT 100')).all<{snapshot:string}>();return r.results.map(r=>JSON.parse(r.snapshot))},
 async getRelease(project,id){const r=await db().prepare('SELECT snapshot FROM code_releases WHERE project=? AND id=?').bind(project,id).first<{snapshot:string}>();return r?JSON.parse(r.snapshot):null},
 async saveRelease(r){await db().prepare("INSERT INTO code_releases(id,project,created_at,snapshot) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET snapshot=excluded.snapshot WHERE json_extract(code_releases.snapshot, '$.status')='failed'").bind(r.id,r.project,r.createdAt,JSON.stringify(r)).run()},
 async listReleases(project){const r=await db().prepare('SELECT snapshot FROM code_releases WHERE project=? ORDER BY created_at DESC LIMIT 40').bind(project).all<{snapshot:string}>();return r.results.map(row=>{const {files,modules,ui,...r}=JSON.parse(row.snapshot) as CodeRelease;return r})},
 async claimDelivery(id){const r=await db().prepare('INSERT INTO code_deliveries(id,created_at) VALUES(?,?) ON CONFLICT(id) DO NOTHING').bind(id,Date.now()).run();return r.meta.changes===1},
 async forgetDelivery(id){await db().prepare('DELETE FROM code_deliveries WHERE id=?').bind(id).run()},
 async repositoryProjects(name){const r=await db().prepare('SELECT snapshot FROM code_projects WHERE repository=? LIMIT 100').bind(name.toLowerCase()).all<{snapshot:string}>();return r.results.map(r=>JSON.parse(r.snapshot) as CodeProject)},
};

import type {CodeRoomStore,CodeRoom} from './rooms.ts';
export const codeRoomStore:CodeRoomStore={
 async get(id){const r=await db().prepare('SELECT snapshot FROM code_rooms WHERE id=?').bind(id).first<{snapshot:string}>();return r?JSON.parse(r.snapshot):null},
 async create(r){await db().prepare('INSERT INTO code_rooms(id,project,release,revision,snapshot) VALUES(?,?,?,?,?)').bind(r.id,r.project,r.release,r.revision,JSON.stringify(r)).run()},
 async replace(r,revision){const result=await db().prepare('UPDATE code_rooms SET revision=?,snapshot=? WHERE id=? AND revision=?').bind(r.revision,JSON.stringify(r),r.id,revision).run();return result.meta.changes===1},
};
