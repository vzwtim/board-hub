'use client';
import {Home,Globe2,GitBranch,UserRound,Link as LinkIcon,Code2} from 'lucide-react';
import {Avatar} from './avatar';
import {Brand} from './brand';
import {useAccount} from './account-provider';
export function SiteNav({selected='',onInvite}:{selected?:string;onInvite?:()=>void}){const {user}=useAccount();return <aside className="catalog-sidebar"><Brand/><nav>{[['/','ホーム',Home],['/community','ゲームを探す',Globe2],['/studio','プロジェクト',GitBranch],['/account','マイページ',UserRound]].map(([url,title,Icon])=>{const I=Icon as typeof Home;return <a key={url as string} className={selected===url?'selected':''} aria-current={selected===url?'page':undefined} href={url as string}><I size={19}/><span>{title as string}</span></a>})}</nav><div className="sidebar-bottom">{onInvite?<button onClick={onInvite}><LinkIcon size={17}/>招待リンクを開く</button>:<a href="/?invite=1"><LinkIcon size={17}/>招待リンクを開く</a>}<a href="/engine"><Code2 size={17}/>開発者向け</a><a className="sidebar-account" href="/profile"><Avatar src={user?.avatar} name={user?.name} size={29}/><span>{user?.name||'ゲスト'}<small>{user?'プロフィールを見る':'ログインせずに遊べます'}</small></span></a></div></aside>}
