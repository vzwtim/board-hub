'use client';
import {ArrowLeft} from 'lucide-react';
import {SiteNav} from './site-nav';
import {MobileBrand} from './mobile-brand';
import {useAccount} from './account-provider';
export function AccountScreen({title,back='/account',backLabel='マイページ',children}:{title:string;back?:string;backLabel?:string;children:React.ReactNode}){return <div className="catalog-shell"><SiteNav selected="/account"/><main className="catalog-main account-main identity-main"><header className="identity-header" style={{display:'block',height:'auto',position:'relative',background:'transparent',backdropFilter:'none',border:0}}><div><MobileBrand/></div><a href={back}><ArrowLeft size={18}/>{backLabel}</a><h1>{title}</h1></header>{children}</main></div>}
export function AccountGate({next='/profile'}:{next?:string}){const {ready,googleAvailable}=useAccount();return <section className="identity-card identity-gate" aria-busy={!ready}>{!ready?<p role="status">読み込み中…</p>:<><h2>ログインして、あなたのプロフィールへ。</h2><p>写真や表示名を設定して、BoardHubを楽しもう。</p><a className="google-signin" href={googleAvailable?'/api/auth/google?next='+encodeURIComponent(next):undefined} aria-disabled={!googleAvailable}>{googleAvailable?'Googleでログイン':'Googleログインは準備中'}</a><a className="identity-text-link" href="/account">ゲストのマイページへ</a></>}</section>}
