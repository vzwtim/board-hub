import {digest,validateFiles,type SourceFiles} from './model.ts';
import {handoffEditable,returnedSource} from '../../lib/code-handoff.ts';
import {RuleError} from '../../engine/types.ts';
export function sourceFingerprint(files:SourceFiles){return digest(JSON.stringify(Object.entries(files).filter(([p])=>handoffEditable(p)).sort(([a],[b])=>a.localeCompare(b))))}
export function reviewReturnedSource(current:SourceFiles,input:unknown,base:unknown){
 if(base!==undefined&&base!==sourceFingerprint(current))throw new RuleError('STALE_STATE','依頼を渡した後に元のコードが更新されています。最新のソースで依頼し直してください');
 const incoming=validateFiles(input),result=returnedSource(current,incoming);
 const before=JSON.parse(current['manifest.json']),after=JSON.parse(result.files['manifest.json']);
 for(const key of ['license','source','forkOf'])if(JSON.stringify(before[key])!==JSON.stringify(after[key]))throw new RuleError('INPUT','派生元とライセンス情報は引き継いでください');
 if(!result.changed.length)throw new RuleError('INPUT','現在の版との変更はありません');
 return result;
}
