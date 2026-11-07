import {CodeProjectList} from '../../components/code-platform/project-list';
import {AccountAvatar} from '../../components/avatar';
import {MobileBrand} from '../../components/mobile-brand';
import {SiteNav} from '../../components/site-nav';

export default function Studio() {
  return <div className="catalog-shell">
    <SiteNav selected="/studio"/>
    <main className="catalog-main studio-main">
      <header className="catalog-header">
        <div><MobileBrand/><h1>ゲーム制作</h1></div>
        <AccountAvatar/>
      </header>
      <p className="workspace-lede">ゲームを遊びながら、AIに相談したり、ルールや画面を変えたりできます。</p>
      <CodeProjectList/>
      <details className="panel">
        <summary>制作ツール・技術資料</summary>
        <p><a href="/api/code-kits/isleworks" download="isleworks-code-kit.zip">島の工房の制作キットをダウンロード</a></p>
        <p><a href="/engine">ゲームエンジンの技術資料 →</a></p>
      </details>
    </main>
  </div>;
}
