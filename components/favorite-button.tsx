'use client';
import {Heart} from 'lucide-react';
import {useAccount} from './account-provider';
export function FavoriteButton({id,title}:{id:string;title:string}){const {favorites,toggle,favoriteReady,pending}=useAccount(),saved=favorites.includes(id);return <button className={'catalog-favorite '+(saved?'saved':'')} disabled={!favoriteReady||pending.includes(id)} aria-label={title+'をお気に入り'+(saved?'から外す':'に追加')} aria-pressed={saved} onClick={()=>toggle(id)}><Heart size={19} fill={saved?'currentColor':'none'}/></button>}
