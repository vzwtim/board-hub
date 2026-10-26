'use client';
import {useEffect,useState} from 'react';
import {ProfileTrigger} from '../../components/profile-context';
import {Pencil,Settings,ChevronRight,LayoutDashboard} from 'lucide-react';
import {Avatar} from '../../components/avatar';
import {useAccount} from '../../components/account-provider';
import {AccountScreen,AccountGate} from '../../components/account-screen';
export default function ProfilePage(){const {user,ready}=useAccount();const [saved,setSaved]=useState(false);useEffect(()=>{if(new URLSearchParams(location.search).has('saved')){setSaved(true);history.replaceState(null,'','/profile')}},[]);return <AccountScreen title="プロフィール">{ready&&user?<>{saved&&<p className="account-notice" role="status">プロフィールを更新しました。</p>}<section className="identity-card profile-display"><Avatar src={user.avatar} name={user.name} size={88}/><span className="eyebrow">PLAYER & CREATOR</span><h2>{user.name}</h2><p>BoardHubでの表示名</p><ProfileTrigger className="profile-edit-link" view="edit" label="プロフィールを編集"><Pencil size={16}/>プロフィールを編集</ProfileTrigger></section><div className="account-menu"><a href="/account"><LayoutDashboard size={19}/><span>マイページ</span><ChevronRight size={17}/></a><a href="/settings"><Settings size={19}/><span>設定</span><ChevronRight size={17}/></a></div></>:<AccountGate/>}</AccountScreen>}
