'use client';
import {useState} from 'react';
import {LogOut,ChevronRight,UserRound} from 'lucide-react';
import {useAccount} from '../../components/account-provider';
import {AccountScreen,AccountGate} from '../../components/account-screen';
export default function SettingsPage(){const {user,ready,logout}=useAccount(),[busy,setBusy]=useState(false),[error,setError]=useState('');return <AccountScreen title="設定" back="/profile" backLabel="プロフィール">{ready&&user?<><section className="identity-card settings-card"><h2>アカウント</h2><dl><div><dt>ログイン方法</dt><dd>Google</dd></div><div><dt>メールアドレス</dt><dd>{user.email}</dd></div></dl><p>メールアドレスは自分にだけ表示されます。</p></section><div className="account-menu"><a href="/profile"><UserRound size={19}/><span>プロフィール</span><ChevronRight size={17}/></a></div><section className="settings-session">{error&&<p role="alert">{error}</p>}<button className="logout-button" disabled={busy} onClick={async()=>{setBusy(true);setError('');try{await logout()}catch{setError('ログアウトできませんでした。もう一度お試しください。');setBusy(false)}}}><LogOut size={17}/>{busy?'ログアウト中…':'ログアウト'}</button></section></>:<AccountGate next="/settings"/>}</AccountScreen>}
