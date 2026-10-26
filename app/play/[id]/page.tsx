import {CommunityPlay} from '../../../components/community-play';
export default async function Page({params}:{params:Promise<{id:string}>}){return <CommunityPlay id={(await params).id}/>}
