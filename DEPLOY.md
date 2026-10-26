# GitHub → Cloudflare Workers

## 現在の準備状態

アプリの移行用ソース、D1マイグレーション、CI、ビルド・公開スクリプトを同梱。
Cloudflareアカウント固有のD1 IDは未設定です。実在するIDを確認する前に公開しません。
既存Sitesの対戦・作品データは移行しません。新しいD1で始めます。

## 初回のみ

1. このソースを専用GitHubリポジトリへ保存。推奨名 `openboard-table`、mainブランチ。
2. Cloudflare管理画面 → Storage & databases → D1 → `openboard-table-db` を作成。
3. 作成結果のDatabase IDを `wrangler.json` の `d1_databases[0].database_id` に設定してcommit。
4. Workers & Pages → Create → Import a repository から当該リポジトリを接続。
5. Worker名を `openboard-table` に設定。rootは `/`、buildは `pnpm build`、deployは `pnpm run deploy`。
6. Buildの環境変数は `NODE_VERSION=24`。pnpmはpackage.jsonのpinを使用。
7. 自動生成するdeploy tokenがD1編集権限を持つことを確認。API tokenをGitHubソースへ書かない。
8. mainを本番ブランチに設定して初回ビルド。`pnpm run deploy` はD1マイグレーション後に生成済みWorkerを公開。
9. 返された実際のworkers.dev URLでCPU・招待・作家保存を確認し、ポートフォリオのリンクを更新。

ローカルから実施する場合：`wrangler login` → `wrangler d1 create openboard-table-db` → ID設定 → `pnpm build` → `pnpm run deploy`。

## 管理者

自分のブラウザで `/studio` を開き、作品を1つ作成。
D1コンソールで `SELECT id, owner FROM table_projects ORDER BY updated_at DESC LIMIT 5;` を確認。
自分の作品のownerをWorker環境変数 `TABLE_ADMIN_AUTHOR_ID` に設定します。
この値は秘密のCookieそのものではなく、一方向ハッシュです。Cookieは共有・公開しないでください。
管理者のCookieを失った場合は、新しいブラウザ作家IDへ管理者設定を変更します。

## 任意のAI API

Cloudflareのsecretとして `OPENAI_API_KEY` を設定。`OPENAI_MODEL` は任意です。
未設定の場合は外部ChatGPTとのJSON受け渡しで利用できます。

## 検証

`pnpm test`、`pnpm typecheck`、`pnpm build`。ローカルD1初期化後は `node scripts/smoke-cloudflare.mjs` で、本番ビルド・作品保存・作家間の分離・招待対戦を実通信で確認できます。
CIはpush/PRごとに実行します。Cloudflare側のGit接続が本番公開を担当し、GitHub ActionsにCloudflareの秘密鍵は不要です。

参考：[Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/)、[Build configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)。
