import {limitedText} from '../../../../server/code-platform/http.ts';
import {codeStore} from '../../../../server/code-platform/store.ts';
import {codeEnvironment,codeGitHub,runtimeLoader} from '../../../../server/code-platform/config.ts';
import {verifyWebhook} from '../../../../server/code-platform/github.ts';
import {processPush} from '../../../../server/code-platform/sources.ts';
import {response,error} from '../../../../server/http.ts';
export async function POST(r:Request){try{
 const text=await limitedText(r,300000);
 const env=codeEnvironment();if(!verifyWebhook(env.BOARDHUB_GITHUB_WEBHOOK_SECRET,text,r.headers.get('x-hub-signature-256')))return response({error:'Invalid signature'},401);
 const event=r.headers.get('x-github-event');if(event==='ping')return response({ok:true});if(event!=='push')return response({ignored:true});
 const id=r.headers.get('x-github-delivery');if(!id||!/^[A-Za-z0-9-]{8,100}$/.test(id))return response({error:'Invalid delivery'},400);
 if(!await codeStore.claimDelivery(id))return response({duplicate:true});
 try{await processPush(codeStore,codeGitHub(),runtimeLoader(),JSON.parse(text))}catch(e){await codeStore.forgetDelivery(id);throw e}
 return response({ok:true});
}catch(e){return error(e)}}
