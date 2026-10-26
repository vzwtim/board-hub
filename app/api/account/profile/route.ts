import {currentAccount,database} from '../../../../server/account-store.ts';
import {body,response,error} from '../../../../server/http.ts';
import {RuleError} from '../../../../engine/types.ts';
export async function POST(r:Request){try{const account=await currentAccount(r);if(!account)throw new RuleError('UNAUTHORIZED','Googleでログインしてください');const data=await body(r),name=typeof data.name==='string'?data.name.trim():'';if(name.length<1||name.length>40||/[\u0000-\u001f]/.test(name))throw new RuleError('INPUT','表示名は1〜40文字で入力してください');await database().prepare('UPDATE boardhub_accounts SET name=?,updated_at=? WHERE id=?').bind(name,Date.now(),account.id).run();return response({name})}catch(e){return error(e)}}
