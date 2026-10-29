import {CodeCreator} from '../../../../components/code-platform/creator';
import {SiteNav} from '../../../../components/site-nav';
export default async function CodeWorkspacePage({params}:{params:Promise<{id:string}>}){const {id}=await params;return <div className="catalog-shell"><SiteNav selected="/studio"/><main className="catalog-main"><CodeCreator id={id}/></main></div>}
