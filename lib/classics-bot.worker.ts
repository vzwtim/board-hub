/// <reference lib="webworker" />
import {botAction,type Board} from '../games/classics/index.ts';
self.onmessage=(event:MessageEvent<{board:Board;revision:number}>)=>{try{self.postMessage({revision:event.data.revision,action:botAction(event.data.board)})}catch(e){self.postMessage({revision:event.data.revision,error:e instanceof Error?e.message:'CPUの手を選べませんでした'})}};
