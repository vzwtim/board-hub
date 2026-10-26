import {currentAccount,publicAccount,googleReady} from '../../../../server/account-store.ts';
import {response,error} from '../../../../server/http.ts';
export async function GET(r:Request){try{const account=await currentAccount(r);return response({user:account?publicAccount(account):null,googleAvailable:googleReady()})}catch(e){return error(e)}}
