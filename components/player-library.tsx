'use client';
import {useEffect,useState} from 'react';
import {Play,ChevronRight,Trash2} from 'lucide-react';
import {games,type GameInfo} from '../lib/game-catalog';
import {savedGames,forgetSavedGame,restoreSavedGame,SAVES_CHANGED,type SavedGame} from '../lib/resume';
import {parseVisits,recentVisits,type Visit} from '../lib/player-library';
import {GamePreview} from './game-preview';
import {FavoriteButton} from './favorite-button';
import {useAccount} from './account-provider';
import {savedGameAccess,observeSavedGame} from '../lib/saved-game-access';
import {prepareGuestTab} from '../lib/guest-tab';
import {entryGameURL} from '../lib/game-navigation';
export function usePlayerLibrary(){const [history,setHistory]=useState<Visit[]>([]),[saves,setSaves]=useState<SavedGame[]>([]),[ready,setReady]=useState(false);useEffect(()=>{async function read(){try{await prepareGuestTab()}catch{}setSaves(savedGames().sort((a,b)=>b.updatedAt-a.updatedAt));try{setHistory(parseVisits(JSON.parse(localStorage.getItem('boardhub-visits')||'[]')))}catch{setHistory([])}setReady(true)}read();window.addEventListener('focus',read);window.addEventListener('pageshow',read);window.addEventListener('storage',read);window.addEventListener(SAVES_CHANGED,read);return()=>{window.removeEventListener('focus',read);window.removeEventListener('pageshow',read);window.removeEventListener('storage',read);window.removeEventListener(SAVES_CHANGED,read)}},[]);return {history,recent:recentVisits(history),saves,ready}}
export function SavedGameLink({save:s,compact=false}:{save:SavedGame;compact?:boolean}){
 const {user}=useAccount();let tab:Storage|null=null;try{tab=sessionStorage}catch{}
 const access=savedGameAccess(s,user?.id,tab),unavailable=access==='guest-tab'||access==='account';
 const note=access==='guest-tab'?'元のゲスト席は参加したタブで再開できます。ここでは観戦できます。':access==='account'?'参加したアカウントでログインすると再開できます。':access==='unknown'?'参加情報はルームで確認します。':'';
 const href=unavailable?observeSavedGame(s):s.href,g=games.find(g=>g.id===s.id||g.title===s.title);
 return <a className={compact?'setup-saved-game':'library-resume-card'} href={href} onClick={e=>{e.currentTarget.href=entryGameURL(href)}}>
  {!compact&&<div className="library-resume-art">{g?<GamePreview game={g.preview as Parameters<typeof GamePreview>[0]['game']}/>:<Play size={24}/>}</div>}
  <div className="saved-game-copy"><strong>{s.title}</strong><small>{s.online?'友だちとの対戦':'ひとり・ローカル対戦'} · {new Date(s.updatedAt).toLocaleDateString('ja-JP',{month:'numeric',day:'numeric'})}{s.room?' · '+(s.room.phase==='lobby'?'参加待ち':'対戦中'):''}</small>{!!s.room?.players.length&&<small>{s.room.players.join('・')}</small>}{note&&<small className="saved-game-note">{note}</small>}</div>
  <span className="library-resume-action"><Play size={14} fill="currentColor"/>{unavailable?'ルームを見る':access==='unknown'?'参加情報を確認':'つづきから'}</span>
 </a>
}
export function ResumeGames({saves}:{saves:SavedGame[]}){const [editing,setEditing]=useState(false),[removed,setRemoved]=useState<SavedGame|null>(null),[ordered,setOrdered]=useState<SavedGame[]>([]);if(!saves.length&&!removed)return null;return <section className="library-resume"><div className="library-section-heading"><h2>つづきから遊ぶ</h2>{saves.length>0&&<button className="resume-manage" aria-pressed={editing} onClick={()=>{if(!editing)setOrdered(saves);setEditing(!editing)}}>{editing?'完了':'整理する'}</button>}</div>{editing&&<p className="resume-manage-note">不要な対局をこの一覧から削除できます。友だちの対戦には影響しません。</p>}<div className="library-resume-list">{(editing?ordered.filter(s=>saves.some(x=>x.id===s.id)):saves).map(s=><div className="resume-card-wrap" key={s.id}><SavedGameLink save={s}/>{editing&&<button className="resume-remove" aria-label={s.title+'を一覧から削除'} onClick={()=>{setRemoved(s);forgetSavedGame(s.id)}}><Trash2 size={17}/></button>}</div>)}</div>{removed&&<div className="resume-undo" role="status"><span>{removed.title}を一覧から削除しました</span><button onClick={()=>{restoreSavedGame(removed);setRemoved(null)}}>元に戻す</button><button aria-label="削除のお知らせを閉じる" onClick={()=>setRemoved(null)}>×</button></div>}</section>}
export function LibraryGameRow({game,save,date,favorite=false}:{game:GameInfo;save?:SavedGame;date?:string;favorite?:boolean}){return <article className="library-game-row"><a className="library-game-main" href={game.href} aria-label={game.title+'の対戦方法を選ぶ'}><div className="library-row-art"><GamePreview game={game.preview as Parameters<typeof GamePreview>[0]['game']}/></div><div><h3>{game.title}</h3><p>{date?new Date(date+'T12:00:00').toLocaleDateString('ja-JP',{month:'numeric',day:'numeric'})+' · ':''}{game.genre} · {game.players}</p></div></a>{favorite&&<FavoriteButton id={game.id} title={game.title}/>}<a className="library-row-play" href={game.href} aria-label={game.title+'の対戦方法を選ぶ'}>遊ぶ<ChevronRight size={16}/></a></article>}
