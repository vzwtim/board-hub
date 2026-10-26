'use client';
import {useEffect,useState} from 'react';
import {UserRound} from 'lucide-react';
import {ProfileTrigger} from './profile-context';
import {useAccount} from './account-provider';
export function Avatar({src,name='',size=32}:{src?:string;name?:string;size?:number}){const [failed,setFailed]=useState(false);useEffect(()=>setFailed(false),[src]);return <span className="avatar-circle" style={{width:size,height:size}}>{src&&!failed?<img src={src} alt="" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>:name?<span>{name.slice(0,1)}</span>:<UserRound size={Math.round(size*.5)}/>}</span>}
export function AccountAvatar(){const {user}=useAccount();return <ProfileTrigger className="account-avatar-link"><Avatar src={user?.avatar} name={user?.name}/></ProfileTrigger>}
export function PlayerAvatar({self=false,name='',src}:{self?:boolean;name?:string;src?:string}){const {user}=useAccount(),photo=self?user?.avatar||src:src;if(!photo)return null;const image=<Avatar src={photo} name={self?user?.name||name:name} size={22}/>;return self?<ProfileTrigger className="player-profile-link">{image}</ProfileTrigger>:image}
