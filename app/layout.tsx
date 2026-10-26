import type { Metadata, Viewport } from 'next';
import './globals.css';
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',interactiveWidget:'resizes-content'};
export const metadata:Metadata={title:'TABLE — OpenBoard Engine',description:'遊ぶが主役。オープンなエンジンで育つボードゲーム。'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="ja"><body>{children}</body></html>}
