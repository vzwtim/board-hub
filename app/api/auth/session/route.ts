import {currentAccount,publicAccount,googleReady,accountEnv} from '../../../../server/account-store.ts';
import {response,error} from '../../../../server/http.ts';
export async function GET(r:Request){try{const account=await currentAccount(r);return response({user:account?publicAccount(account):null,googleAvailable:googleReady(),...(!googleReady()?{googleConfiguration:{clientIdConfigured:!!accountEnv().GOOGLE_CLIENT_ID,clientSecretConfigured:!!accountEnv().GOOGLE_CLIENT_SECRET}}:{})})}catch(e){return error(e)}}
