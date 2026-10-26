import {Shield,Star,Route,PackageOpen,Boxes} from 'lucide-react';
import type {CardKind} from '../../games/frontier/index.ts';
export const CARD_INFO:Record<CardKind,{count:number;short:string;detail:string}>={
 knight:{count:14,short:'妨害者を移動し、隣接する相手から資源を1枚奪います。',detail:'別の土地へ移動し、その土地に拠点・都市を持つ相手を選択。資源はランダムに1枚奪います。7と違い、資源の廃棄は起きません。使用済みの護衛が3枚以上で最多になると「護衛隊」2点の対象になります。'},
 victory:{count:5,short:'持っているだけで1点。使う操作は不要です。',detail:'購入した直後から自分の得点に加算されます。手札に残り、通常は相手には内容も得点も見えません。自分の手番で合計10点に達すると勝利します。1手番1枚の使用制限には数えません。'},
 roads:{count:2,short:'資源を払わず、街道を最大2本建設できます。',detail:'通常の接続ルールに従い、1本ずつ盤面で選んで確定します。最初の1本からつなげて2本目を置けます。合法な場所や街道コマが足りない場合は、残りを終了できます。'},
 plenty:{count:2,short:'銀行から好きな資源を合計2枚受け取ります。',detail:'2つの選択欄で1枚ずつ選びます。同じ種類を2枚でも、別の種類を1枚ずつでも構いません。銀行に残っている資源だけ受け取れます。'},
 monopoly:{count:2,short:'資源を1種類指定し、相手全員のその資源をすべて回収します。',detail:'自分以外の全プレイヤーが持つ、指定した種類の資源を受け取ります。銀行の資源は対象外です。相手がその資源を持っていない場合もカードは消費されます。'}
};
export function CardSymbol({kind}:{kind:CardKind}){const Icon={knight:Shield,victory:Star,roads:Route,plenty:PackageOpen,monopoly:Boxes}[kind];return <span className={'dev-symbol dev-'+kind}><Icon size={22} aria-hidden="true"/></span>}
