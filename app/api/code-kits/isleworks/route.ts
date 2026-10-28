import {isleworksFiles} from '../../../../code-kit/bundle.ts';
import {sourceZip} from '../../../../code-kit/zip.ts';
export async function GET(){return new Response(sourceZip(isleworksFiles()),{headers:{'Content-Type':'application/zip','Content-Disposition':'attachment; filename="isleworks-code-kit.zip"','X-Content-Type-Options':'nosniff','Cache-Control':'public, max-age=300'}})}
