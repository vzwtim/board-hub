import {GameBrowser} from '../../components/game-browser';
export default async function Discover({searchParams}:{searchParams:Promise<{view?:string}>}){const q=await searchParams;return <GameBrowser explore initialSource={q.view==='favorites'?'favorites':'all'}/>}
