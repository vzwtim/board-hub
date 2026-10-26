'use client';
import {createContext,useContext} from 'react';
export type ProfileView='profile'|'edit'|'settings';
export const ProfileContext=createContext<((view?:ProfileView)=>void)|null>(null);
export function useProfile(){const open=useContext(ProfileContext);if(!open)throw Error('ProfileProvider is missing');return open}
export function ProfileTrigger({children,className='',label='自分のプロフィール',view='profile'}:{children:React.ReactNode;className?:string;label?:string;view?:ProfileView}){const open=useProfile();return <button type="button" className={className} aria-label={label} title={label} aria-haspopup="dialog" onClick={()=>open(view)}>{children}</button>}
