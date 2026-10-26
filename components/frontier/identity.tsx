'use client';
import {ProfileTrigger} from '../profile-context';
import {Compass,Flame,Gem,Sun,type LucideProps} from 'lucide-react';
import {Avatar} from '../avatar';
import type {Seat} from '../../games/frontier/index.ts';
export const COLORS:Record<Seat,string>={'0':'#0071e3','1':'#d86850','2':'#805fc0','3':'#b58013'};
export const SEAT:Record<Seat,{name:string;symbol:string;dot:string}>={'0':{name:'コンパス',symbol:'✦',dot:'🔵'},'1':{name:'炎',symbol:'▲',dot:'🟠'},'2':{name:'宝石',symbol:'◆',dot:'🟣'},'3':{name:'太陽',symbol:'☀',dot:'🟡'}};
export function SeatIcon({seat,...props}:LucideProps&{seat:Seat}){const Icon=({0:Compass,1:Flame,2:Gem,3:Sun})[seat];return <Icon aria-hidden="true" {...props}/>}
export function PlayerBadge({seat,name,small=false,avatar,profile=false}:{seat:Seat;name:string;small?:boolean;avatar?:string;profile?:boolean}){const content=<>{avatar?<Avatar src={avatar} name={name} size={small?20:25}/>:<span className="seat-avatar"><SeatIcon seat={seat} size={small?12:15}/></span>}<span>{name}</span></>,style={'--player-color':COLORS[seat]} as React.CSSProperties;return profile?<span style={style}><ProfileTrigger label={name+'のプロフィール'} className={'player-badge '+(small?'small':'')}>{content}</ProfileTrigger></span>:<span title={SEAT[seat].name+' · '+name} className={'player-badge '+(small?'small':'')} style={style}>{content}</span>}
export const playerOption=(seat:Seat,name:string)=>`${SEAT[seat].dot} ${SEAT[seat].name} · ${name}`;
