import type { Metadata, Viewport } from 'next';
import './globals.css';
import {InstallPrompt} from '../components/install-prompt';
import {PlayHistory} from '../components/play-history';
import {ProfileProvider} from '../components/profile-provider';
import {AccountProvider} from '../components/account-provider';
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',interactiveWidget:'resizes-content',themeColor:'#f8fafc'};
export const metadata:Metadata={title:'BoardHub — ボードゲームを遊ぶ。つくる。育てる。',description:'ボードゲームを見つけて、友だちと遊ぼう。AIとルールを育て、公開できるオープンなボードゲームプラットフォーム。',manifest:'/manifest.webmanifest',appleWebApp:{capable:true,title:'BoardHub',statusBarStyle:'default'},icons:{icon:'/favicon.svg',apple:'/icons/boardhub-180.png'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="ja"><body><AccountProvider><ProfileProvider><PlayHistory/><InstallPrompt/>{children}</ProfileProvider></AccountProvider></body></html>}
