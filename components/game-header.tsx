'use client';
import {ArrowLeft} from 'lucide-react';
import {AccountAvatar} from './avatar';
export function GameHeader({title,backHref='/community',backLabel='ゲーム一覧に戻る',children}:{title:string;backHref?:string;backLabel?:string;children?:React.ReactNode}){return <header className="game-header game-toolbar"><div className="game-toolbar-leading"><a className="game-back-button" href={backHref} aria-label={backLabel} title={backLabel}><ArrowLeft size={20}/></a><div className="game-toolbar-heading"><span>BOARDHUB</span><strong title={title}>{title}</strong></div></div><div className="game-header-tools" role="group" aria-label="ゲームの補助操作">{children}<span className="game-toolbar-divider" aria-hidden="true"/><AccountAvatar/></div></header>}
