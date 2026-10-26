export default function Engine(){return <main className="docs"><a href="/">← TABLEで遊ぶ</a><div className="eyebrow muted" style={{marginTop:45}}>OPENBOARD ENGINE / PHASE 1</div><h1>ルールを書こう。<br/>対戦の土台は、エンジンに。</h1><p>TABLEの裏側に、ゲームロジックと通信を分離したTypeScriptのエンジンを実装しました。カラハと、資源・ネットワーク構築ゲーム「島の工房」を収録。オンラインの操作をサーバーで検証し、確定した盤面を全員へ同期します。</p><div className="docgrid"><section className="panel"><span className="tag">ENGINE / 0.1.0</span><h3 style={{marginTop:18}}>状態と手番の、共通言語。</h3><p className="small">State・Action・Phase、合法手検証、冪等な操作、版の固定、イベントログとリプレイ。ゲーム本体はsetup / validate / reduce / playerViewを実装します。</p></section><section className="panel"><span className="tag">TRANSPORT / D1 + HTTP</span><h3 style={{marginTop:18}}>同じ盤面を、別のブラウザへ。</h3><p className="small">招待ルーム、席トークン、永続保存、約1.5秒間隔の同期。revisionによる条件付き更新で、二重操作と古い盤面からの上書きを防ぎます。</p></section></div><h2>基本データ構造</h2><pre>{`type Seat = '0' | '1' | '2' | '3';

type TurnPhase = 'lobby' | 'playing' | 'finished';

type Action<A> = {
  id: string;                    // 再送を識別
  playerID: Seat;            // サーバーが席トークンから確定
  expectedRevision: number;      // 楽観的排他
  payload: A;                    // ゲーム固有の操作
};

type GameState<G, A> = {
  gameID: string; gameVersion: string;
  revision: number; phase: TurnPhase;
  turn: number; currentPlayer: Seat;
  players: Player[]; board: G;
  winner: Seat | 'draw' | null;
  events: Event<A>[];
};`}</pre><h2>ゲーム追加の契約</h2><pre>{`const game: GameDefinition<Board, Move> = {
  id: 'my-game', version: '1.0.0',
  setup: () => initialBoard,
  validate: (board, player, action) => null, // 違反時は理由
  reduce: (board, player, action) => ({
    board: nextBoard, nextPlayer, winner
  }),
  playerView: (board, viewer) => visibleBoard
};

// 通信もDBも持たない、純粋なゲーム更新
const next = applyAction(game, state, action);
const past = replay(game, next, 3);`}</pre><p className="small">島の工房2.0は2〜4席に対応し、ダイス・抽選をサーバーで確定します。相手の資源内容・発展カード・山札・非公開イベントを応答から除外します。汎用の安全なサンドボックスとして任意コードを受け付ける機能はありません。</p><h2>疎通API</h2><table><thead><tr><th>操作</th><th>エンドポイント</th><th>役割</th></tr></thead><tbody><tr><td>POST</td><td>/api/rooms</td><td>部屋を作成し、席0を発行</td></tr><tr><td>GET</td><td>/api/rooms/:id</td><td>盤面取得・再接続</td></tr><tr><td>POST join</td><td>/api/rooms/:id</td><td>空いている席1に参加</td></tr><tr><td>POST move</td><td>/api/rooms/:id</td><td>認証・合法手検証・原子的な更新</td></tr></tbody></table><h2>島の工房と、体験型チュートリアル。</h2><p>新作は独立した2個のダイス、交点の往復初期配置、5資源、港・対人交換、妨害者、発展カード、最長路、10点勝利を実装。リバーシと四目並べにはCPU・同じ画面・招待対戦を用意。/api/frontier は共通のD1リポジトリを利用し、ゲーム固有の操作をサーバーで検証します。チュートリアルは本番と同じルールを練習用の状態に適用し、実際の対戦に影響を与えません。</p><a className="button" href="/frontier">島の工房で遊ぶ ↗</a><h2>AIと、ブランチで育てる。</h2><p>公開版はゲームIDと版を固定。改善は別ブランチで試遊し、作者が比較して採用する構想です。対戦開始後のルールは変更しません。将来はレビューを改善課題に変換し、AIがルールとUIの変更・テストを提案します。</p><a className="button" href="/studio">制作ワークスペースを開く ↗</a><h2>今回できること、次に作ること</h2><table><thead><tr><th>Phase 1・実装済み</th><th>今後の実装</th></tr></thead><tbody><tr><td>型付きコア・カラハ・島の工房・リバーシ・四目並べ</td><td>ゲームパッケージの登録・隔離実行</td></tr><tr><td>招待対戦・DB保存・競合防止</td><td>自動マッチング・レーティング</td></tr><tr><td>イベントからの巻き戻し表示</td><td>WebSocket等のプッシュ通知</td></tr><tr><td>ソース内のセルフホスト手順・テスト</td><td>公開GitHubリポジトリ・パッケージ配布</td></tr><tr><td>作者保存・変更提案・差分・試遊・反映</td><td>AI接続キーの設定・任意ゲームへの制作範囲拡張</td></tr></tbody></table><p className="fine">コアとサンプルの自作コードはMITライセンスで提供する構成です。依存ライブラリのライセンスは個別に適用されます。GitHubへの一般公開、課金・販売機能はまだ実施していません。既存商業ゲームの画像・説明文・実装は収録していません。</p></main>}
