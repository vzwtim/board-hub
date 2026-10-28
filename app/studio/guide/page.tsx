import styles from './guide.module.css';
import {AccountAvatar} from '../../../components/avatar';
import {MobileBrand} from '../../../components/mobile-brand';
import {SiteNav} from '../../../components/site-nav';

const steps = [
  ['1. ひな形から自分の作品を作る', 'プロジェクトでひな形を選びます。最初は三目・四目などの連結ゲーム。ゲストでも試作でき、ログインすると作品を引き継げます。'],
  ['2. ルールを一つ変える', '作品の「＋ 変更を作る」から、例えば盤面を5×4、3つ連結で勝利に変更。設定から保存できます。AI未接続なら「ChatGPT用の依頼をコピー」し、回答のJSONを取り込む方法も使えます。'],
  ['3. 元の版と変更案を遊び比べる', '「ブランチ・変更」で差分を確認し、「このブランチを試遊」します。「遊ぶ・概要」の版選択で元の版も確認。変更案の保存だけではmainは変わりません。'],
  ['4. 友だちに試遊してもらう', '試したい版を選んで「友だちと対戦」へ進み、対戦画面の招待リンクを送ります。作品画面の「共有」は作品・版を見せるリンクです。同じ部屋で対戦するには対戦用の招待リンクを使います。'],
  ['5. 感想を受けて、変更を採用する', '分かりにくかったルール、決着までの長さ、もう一度遊びたいかを聞きます。感想の共有保存はまだ未対応なので、版名と一緒に手元へ記録。「ブランチ・変更」で納得した案をmainへ反映します。追加の改良は新しいmainから分岐します。'],
  ['6. 公開して、もう一度育てる', '「公開設定」から「ゲームを探すに公開する」を選びます。リンク限定でも試遊できます。ホームへの掲載は運営の選定です。開始済みの対戦は元のルールで続きます。'],
];

export default function CreatorGuide() {
  return <div className="catalog-shell"><SiteNav selected="/studio"/><main className="catalog-main engine-main">
    <header className="catalog-header"><div><MobileBrand/><span className="catalog-breadcrumb">CREATOR GUIDE</span><h1>つくって、遊んでもらって、育てよう。</h1></div><AccountAvatar/></header>
    <section className="engine-intro"><span className="eyebrow">最初の作品を、試遊から改訂まで</span><h2>まずはルールを<br/>一つ変えてみよう。</h2><p>盤面や勝利条件を変え、友だちとのオンライン試遊へ。通信や保存のコードを書かずに、小さな変更から始められます。</p><div><a className="button primary" href="/studio">ひな形を選んで始める</a><a className="button" href="/community">公開作品を見る</a></div></section>
    <div className={"engine-capabilities "+styles.steps}>{steps.map(([title,description])=><article key={title}><h2>{title}</h2><p>{description}</p></article>)}</div>
    <section className="engine-direction"><h2>いまできること</h2><p>連結ゲームの盤面サイズ・連結条件・石の落下・障害物・説明・配色を変更できます。手札ゲーム全般や任意のJavaScriptの実行にはまだ対応していません。</p><p>ゲスト作品の所有確認にはブラウザのCookieを使います。Cookieを消す前にログインして作品を引き継いでください。</p><a href="/engine/docs">エンジンの仕組み・対応範囲を見る ↗</a></section>
    <footer><a href="/studio">プロジェクトへ</a><span>BoardHub · 遊ぶ。つくる。育てる。</span></footer>
  </main></div>;
}
