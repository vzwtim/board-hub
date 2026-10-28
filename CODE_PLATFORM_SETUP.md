# コード作品のオンライン接続設定

アプリ側はGitHub接続・フォルダアップロード・隔離試遊・公開の両経路を実装しています。現在の環境にGitHub Appの秘密鍵と隔離実行の設定はありません。未設定のまま成功扱いにはせず、作品画面へ設定待ちを表示します。

## 作者が使う流れ

### GitHubを使う人

1. `/studio/code` で作品を作成する。
2. ゲームだけのGitHubリポジトリを作成/フォーク。下記GitHub Appを対象リポジトリへ導入する。
3. 作品画面の接続ファイルをダウンロードし、ゲームと同じフォルダへ `boardhub-link.json` としてpushする。
4. 所有者/リポジトリ、ブランチ、フォルダを入力し「接続して取り込む」。接続ファイルで書き込み権限を確認する。
5. 以後のpushはWebhook経由で試遊版へ反映。「GitHubの更新を取り込む」で手動更新も可能。
6. 固定版の試遊URLを共有し、確認後に作者が公開版を選ぶ。

### GitHubを操作しない人

1. 同じ画面で作品を作成し、キットをダウンロードしてZIPを展開する。
2. `AI_REQUEST.md` に希望を書き、フォルダを外部AIへ渡す。
3. 戻ったファイルを反映し、作品画面のフォルダ選択からアップロードする。GitHub操作やNodeのインストールはこの経路では不要。
4. アプリが管理用GitHubリポジトリの `projects/<作品ID>/` にコミットし、同じ検証・試遊へ進める。
5. 確認後に公開版を選ぶ。アップロードやpushだけでは公開中の版は変わらない。

初版はZIPそのものではなく**展開したフォルダ**を選択します。自己完結したHTMLのUIとローカルのTS/JSモジュールに対応し、npm依存の追加、TSX、外部スクリプト・画像配信には未対応。画像等はdata URLやインラインSVGを使用します。ゲームルールと操作は独自コードで追加できます。

## 運営側の初回設定

### 1. GitHub App

GitHubでAppを作成し、必要なリポジトリだけに導入します。

- Repository permissions: Contents read/write。接続確認、ソース読み取り、アップロードのコミットに使用。
- Webhook URL: `https://<BoardHubの公開ドメイン>/api/code-github/webhook`
- Webhook events: Push。
- Webhook secretを生成し、秘密鍵を取得。App IDと導入URLも控える。

GitHub Appの作成・ユーザーによる導入は、このリポジトリを更新しただけでは行われません。GitHubの接続済みチャット用アプリの権限も、公開Webアプリへ自動移譲されません。

### 2. アップロード用の保存先

運営の非公開GitHubリポジトリを用意し、初期コミットとmainブランチを作成。Appを導入します。作者ごとにゲームのフォルダを分け、他作品のフォルダへ書き込ませません。公開リポジトリを設定すると、初心者向けアップロードは拒否します。

この方式では初心者はGitHubアカウントを持たずに利用できます。GitHubが使える作者の作品は、本人のリポジトリへ接続します。

### 3. Cloudflareの秘密設定

CloudflareのWorker Secretsへ設定します。実値をソースに書かないでください。

```sh
pnpm exec wrangler secret put BOARDHUB_GITHUB_APP_ID
pnpm exec wrangler secret put BOARDHUB_GITHUB_APP_PRIVATE_KEY
pnpm exec wrangler secret put BOARDHUB_GITHUB_WEBHOOK_SECRET
```

Workerの変数へ設定:

- `BOARDHUB_GITHUB_REPOSITORY`: 運営の非公開保存先 `owner/repository`
- `BOARDHUB_GITHUB_BRANCH`: 保存先ブランチ（通常main）
- `BOARDHUB_GITHUB_INSTALL_URL`: Appの導入URL

### 4. 隔離実行

Dynamic Workersに対応したCloudflare環境で、`wrangler.json` にWorker Loader bindingを追加してビルド・配信します。

```json
{"worker_loaders":[{"binding":"CODE_LOADER"}]}
```

ゲームのルールは空のenv、外部通信不可、CPU/サブリクエスト制限を指定した別Workerで実行します。アップロードされたnpm scriptsやGitHub workflowsは実行しません。TypeScriptはメモリ上で構文変換し、共通SDKとホスト側の実行処理は運営の版を使用します。

まず運営だけで試し、本番環境で無限ループ・過大な出力・通信遮断・他作品からの分離を確認してください。ローカルworkerdではCPU超過の強制終了を確認できていないため、CPU制限の本番確認は未完です。確認するまでは `BOARDHUB_CODE_ENABLED` を未設定にし、一般のコード実行を無効のままにします。

確認後、Workerの変数 `BOARDHUB_CODE_ENABLED=true` を設定するとオンライン試遊を有効化します。Loaderがあってもこの変数がなければ実行しません。

### 5. DB

追記型 `drizzle/0003_code_platform.sql` を適用します。通常のデプロイスクリプトで既存マイグレーションに続けて適用。API起動時の追加テーブル初期化にも対応しています。既存ゲームのテーブルを変更・削除しません。

## 確認

- `/api/code-projects` の capabilities と作品画面で設定状態を確認。
- 自分の作品をアップロードして管理用GitHubにcommitができる。
- 取り込んだ版が「試遊可能」になり、別ブラウザで参加・操作できる。
- GitHubのpushで新しい試遊版が増える。公開中の版は変わらない。
- 作者だけが公開/過去の版への切り替えをできる。
- 進行中の部屋が元のreleaseに固定される。

自動取り込みは現時点ではWebhookのリクエスト内で処理します。大規模なリポジトリや多数同時更新にはキュー化が必要です。失敗時はGitHubでWebhookを再送するか、作品画面で手動取り込みしてください。

## 開発時の検証

```sh
pnpm test
pnpm typecheck
pnpm build
node scripts/smoke-code-platform.mjs
node scripts/smoke-code-http.mjs
# Chromiumが利用できる環境で:
node scripts/smoke-code-browser.mjs
```

最後のブラウザ検証はPlaywrightとChromiumがある開発環境向けです。GitHub APIの実通信と本番設定は未確認で、GitHub APIは署名/権限/接続ファイルのモックテスト、隔離実行とHTTP APIはローカル実ランタイムで確認します。ブラウザ表示の検証は、この環境でChromiumを取得できず未完です。

参照: https://developers.cloudflare.com/dynamic-workers/getting-started/ / https://developers.cloudflare.com/dynamic-workers/api-reference/
