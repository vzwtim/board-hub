# TABLE / OpenBoard Engine

遊ぶ、試す、AIとルールを育てるボードゲーム・プラットフォームのプロトタイプ。
TypeScript の純粋なゲームエンジンと、React / Vinext / Cloudflare Workers / D1 による Web アプリです。

## 遊べるゲーム

- 島の工房：2個のダイス、初期配置、資源交渉、最長路、発展カードを扱う2〜4人の開拓ゲーム。
- 綴りの王国：10種類の行動カード、連続使用、購入、廃棄、攻撃・防衛を備える2〜4人のデッキ構築。
- 街道と城郭：独自構成72タイル、回転配置、城郭・街道・修道院・農地、占有と多数決の2〜4人ゲーム。
- カラハ、リバーシ、四目並べ、3つの短時間ミニゲーム。

CPU練習、友だちへの招待、チュートリアル、詳しいルール、効果音、盤面アニメーションを備えます。
既存商業ゲームの名称・画像・説明文・ソースコードは収録せず、独自名称・描画・文章を使用しています。

## 作る・公開する

`/studio` で連結ゲームのテンプレートを自分の作品としてD1に保存。
AIへの指示から変更案を作り、ブランチで差分と試遊を確認してmainへ反映します。
AI API未設定時も「ChatGPT用の依頼をコピー」とJSON取り込みを利用できます。
公開作品は `/community` へ。ホーム掲載は管理者だけが選びます。

Cloudflare移行版では、256ビットの秘密のブラウザキーをHttpOnly / Secure Cookieに保持し、そのSHA-256を作家IDに使います。
公開作品・招待URLにブラウザキーは含めません。Cookieを消した場合や別端末での編集権限復旧は未対応です。
本格的なアカウント・端末同期は今後の実装対象です。

## 開発

Node 24、package.jsonで指定したpnpmを使用します。

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm test
pnpm typecheck
pnpm exec wrangler d1 migrations apply DB --local
pnpm dev
pnpm build
```

デプロイ手順は [DEPLOY.md](DEPLOY.md)。Cloudflare Workers BuildsでGitHub mainを接続すると、pushから自動公開できます。

## 構成

| ディレクトリ | 役割 |
|---|---|
| `engine/` | 状態・アクション・手番・検証・リプレイの共通契約 |
| `games/` | 各ゲームの純粋なルールとCPU |
| `server/` | D1永続化、参加トークン検証、競合制御、非公開情報の投影 |
| `app/`, `components/` | カタログ、ゲーム、ルール、作家ワークスペース |
| `drizzle/` | 追記型D1マイグレーション |
| `worker/` | Cloudflare単体のエントリーポイント |

対戦はサーバーを正としてrevisionで競合を防ぎ、同じ操作IDの再送を二重処理しません。
山札順・他人の手札・生のイベント履歴は非公開ゲームのAPIに返しません。
通信は約1.5秒間隔のポーリング。マッチング、Elo、課金、任意生成コードの実行は未実装です。

MIT License。依存パッケージのライセンスはそれぞれに従います。
