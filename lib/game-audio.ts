export type Cue='pickup'|'sow'|'capture'|'extra'|'finish'|'turn';
/** Original synthesized effects, no third-party audio assets. Starts only after interaction. */
export class GameAudio {
 private ctx:AudioContext|null=null; private gain:GainNode|null=null;
 private enabled=true; private volume=.35;private voices=new Set<OscillatorNode>();
 unlock(){try{if(!this.ctx){this.ctx=new AudioContext();this.gain=this.ctx.createGain();this.gain.gain.value=this.enabled?this.volume:0;this.gain.connect(this.ctx.destination)}if(this.ctx.state==='suspended')void this.ctx.resume().catch(()=>{})}catch{/* Audio may be unavailable; visuals always work. */}}
 preferences(enabled:boolean,volume:number){this.enabled=enabled;this.volume=volume;this.gain?.gain.setTargetAtTime(enabled?volume:0,this.ctx!.currentTime,.015);if(!enabled)this.stop()}
 stop(){for(const voice of this.voices){try{voice.stop()}catch{}}this.voices.clear()}
 private tone(hz:number,duration:number,delay=0,level=.15){const c=this.ctx,g=this.gain;if(!c||!g||c.state!=='running'||!this.enabled||document.hidden)return;const t=c.currentTime+delay,o=c.createOscillator(),envelope=c.createGain();o.type='sine';o.frequency.setValueAtTime(hz,t);o.frequency.exponentialRampToValueAtTime(hz*.7,t+duration);envelope.gain.setValueAtTime(.0001,t);envelope.gain.exponentialRampToValueAtTime(level,t+.004);envelope.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(envelope);envelope.connect(g);this.voices.add(o);o.onended=()=>{this.voices.delete(o);o.disconnect();envelope.disconnect()};o.start(t);o.stop(t+duration+.02)}
 play(cue:Cue,index=0){if(cue==='sow'){this.tone(1000+(index%7)*65,.055,0,.11);this.tone(220,.07,0,.13)}else if(cue==='pickup'){this.tone(480,.07,0,.08);this.tone(700,.055,.035,.06)}else if(cue==='capture'){[660,830,990].forEach((v,i)=>this.tone(v,.15,i*.055,.13))}else if(cue==='extra'){this.tone(660,.14,0,.1);this.tone(880,.2,.09,.1)}else if(cue==='finish'){[523,659,784,1046].forEach((v,i)=>this.tone(v,.3,i*.12,.1))}else this.tone(600,.08,0,.07)}
}
export const gameAudio=new GameAudio();
