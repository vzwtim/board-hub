# BoardHub Googleログインの初期設定

ログイン実装は、認可コードフロー + PKCE + state + nonce + Googleの公開鍵によるIDトークン検証を使用します。
要求する権限は `openid email profile` のみ。Googleのアクセストークン・リフレッシュトークンは保存しません。
BoardHubのセッションは30日、有効期限付きの秘密のCookieを発行し、D1にはそのハッシュだけ保存します。

## あなたのGoogle Cloudで一度だけ行うこと

1. Google Cloud ConsoleでBoardHub用のプロジェクトを選択／作成。
2. Google Auth Platformでアプリ名を `BoardHub` にし、サポートメール・開発者連絡先を自分のアドレスに設定。
3. Audienceは一般公開ならExternal。Testingの間は自分のGoogleアカウントをテストユーザーに追加。
4. ClientsからOAuthクライアントを作成。種類は **Web application**。
5. Authorized JavaScript origins：`https://board-hub.babachan.workers.dev`
6. Authorized redirect URIs：`https://board-hub.babachan.workers.dev/api/auth/google/callback`
7. 発行されたClient IDとClient secretを控える。secretはGitHubやチャットに貼らない。

## Cloudflareに直接登録

Workers & Pages → board-hub → Settings → Variables and Secrets：

| 名前 | 種類 | 値 |
|---|---|---|
| `GOOGLE_CLIENT_ID` | Text | Googleで発行されたClient ID |
| `GOOGLE_CLIENT_SECRET` | Secret | Googleで発行されたClient secret |
| `BOARDHUB_ORIGIN` | Text | `https://board-hub.babachan.workers.dev` |
| `TABLE_ADMIN_EMAIL` | Secret または Text | 管理者にしたいGoogleのメールアドレス（任意） |

`wrangler.json`のkeep_varsで管理画面のText設定を維持します。Secretはソースへ含めません。
Buildsのdeploy commandを `pnpm run deploy` に設定して再デプロイしてください。
このコマンドは `drizzle/0002_boardhub_accounts.sql` を含むD1初期化を実行してから公開します。空のD1では、API初回アクセス時にも追加型のテーブル作成を行い、初期化漏れから復旧します。

## 確認

- `/account` のGoogleボタンからログインし、マイページへ戻る。
- 別の端末でも同じGoogleアカウントで、お気に入りとプロジェクトを確認。
- ログイン前のこのブラウザのプロジェクトは、ログインしたアカウントへ移します。
- この端末のお気に入りは初回ログイン時に同期します。レビューは引き続きこの端末内の記録です。
- ログアウトするとそのセッションをD1で失効し、別の人のセッションには影響しません。

接続情報が未設定の間も、CPU対戦、招待対戦、端末のお気に入り、ゲストの試作は使えます。
Googleログインのボタンは「準備中」と表示し、未接続のログイン画面へ誘導しません。

Google公式：[OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect)。

## すでに Builds → Variables and secrets に登録した場合

その値はビルド環境にだけ渡されます。Deploy command を `pnpm run deploy` にすると、
このリポジトリのデプロイスクリプトが Client ID・Origin・管理者メールを本番設定へ渡し、
Client secret を Wrangler の標準入力経由で Worker の Secret に登録します。
Secret の値は生成設定ファイルやログへ出しません。
Worker の実行時設定に直接登録してある場合も、その設定を維持します。
