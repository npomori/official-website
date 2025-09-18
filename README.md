# NPO森 公式サイト（official-website）

Astro v5 + React 19 + Tailwind CSS 4 をベースに、会員向け機能（ニュース/記録/イベント/記事）と管理UIを備えた公式ウェブサイトです。サーバーは Astro Node アダプタ（standalone）で、認証は Redis セッション + Cookie（Remember Me）、DB は Prisma + MySQL を使用します。

## 技術スタック

- フレームワーク: `Astro v5`（Hybrid SSR/CSR）、`@astrojs/react`
- 言語: `TypeScript`
- フロント: `React 19`、`SWR 2`、`Nanostores`
- スタイル: `Tailwind CSS 4`（`@tailwindcss/vite`、`prettier-plugin-tailwindcss`）
- コンテンツ: `astro:content`（`src/content/config.ts`）
- サーバ/API: Astro Middleware + API Routes（`src/middleware/*`, `src/pages/api/*`）
- 認証/セッション: Redis セッション（`ioredis`）+ Cookie（Remember Me）
- DB: Prisma + MySQL（`prisma/schema.prisma`）
- 画像/MDX: `@mdx-js/*`、`react-markdown`、`rehype-*`、`remark-gfm`

## 主要機能

- 会員ニュース（カテゴリ/優先度/添付/会員限定/ダウンロード集計）
- 活動記録（カテゴリ/画像/レポート/ヒヤリハット）
- イベント（FullCalendar 表示、カテゴリ、コメント）
- 記事（MDX + React コンポーネント、タグ、SEO、会員限定）
- 認証・権限（ADMIN/MODERATOR/EDITOR/その他）、保護ルート、Remember Me
- 管理UI（`/admin` 配下）と保護 API（`/api/admin/**`, `/api/member/**`）

## 動作要件

- Node.js 18 以上（推奨 LTS）
- pnpm（本リポジトリは pnpm を使用）
- MySQL（`DATABASE_URL` 必須）
- Redis（セッション用。`SESSION_REDIS_URL` 必須）

## セットアップ（Windows PowerShell）

1) 依存関係のインストール

```powershell
pnpm install
```

2) 環境変数の設定（ルートに `.env` を作成）

```dotenv
# Database
DATABASE_URL="mysql://username:password@localhost:3306/official_website"

# Session / Cookie
SESSION_REDIS_URL="redis://localhost:6379/"
```

3) DB の初期化（Prisma）

```powershell
pnpm db:generate
pnpm db:migrate
pnpm db:seed          # 初期ユーザーの投入（admin@example.com ほか）
pnpm db:seed:news     # ニュースのサンプル大量投入
pnpm db:seed:events   # イベントのサンプル投入
pnpm db:seed:records  # 活動記録のサンプル投入
pnpm db:seed:articles # 記事のサンプル投入
```

4) 開発サーバーの起動

```powershell
pnpm dev
```

ブラウザで `http://localhost:3000` へアクセス。

初期アカウント（seed）
- 管理者: `admin@example.com` / パスワード: `password`（bcrypt でハッシュ化されて投入済み）
- 一般: `user@example.com` / 同上

## パッケージスクリプト

- `pnpm dev` 開発サーバー（3000 番）
- `pnpm build` 本番ビルド（`output: 'server'`）
- `pnpm preview` ビルド結果のプレビュー
- `pnpm start` `node ./dist/server/entry.mjs` で起動（Node アダプタ standalone）
- `pnpm lint` ESLint 実行、`pnpm format` Prettier 実行
- Prisma: `db:generate` / `db:migrate` / `db:studio` / `db:reset` / `db:seed*`

## ディレクトリ構成（抜粋）

```
src/
  components/        # React/TSX コンポーネント
  content/           # astro:content のコレクション（articles など）
  config/            # JSON 設定（menu.json / news-category.json など）
  fetch/             # フロントからの API 呼び出しラッパ（BaseApiFetch 等）
  hooks/             # SWR 共通 fetcher
  layouts/           # Astro レイアウト
  middleware/        # auth などのグローバルミドルウェア
  pages/             # Astro ページと API ルート（/api/**）
  server/            # サーバサイド util / config / db
    config.ts        # 保護ルート・Cookie/Redis 設定
    db/              # DB 関連（必要に応じて）
    utils/           # 認証/セッションユーティリティ
  store/             # Nanostores
  schemas/           # Zod スキーマ（news, record など）
  types/             # 共通型定義（ApiResponse, DTO 型 など）
prisma/
  schema.prisma      # Prisma スキーマ
  seeds/*.mjs        # 初期データ投入スクリプト
public/              # 静的アセット・アップロード保存先
```

補足: インポートは `@/*` エイリアスを使用（`baseUrl: ./src`）。

## 認証・権限と保護ルート

- ミドルウェア `src/middleware/auth.ts` が `locals.user` と `locals.session` を設定
- 保護対象: `PROTECTED_ROUTES = ['/admin', '/api/admin', '/api/member']`
- EDITOR 許可: `EDITOR_ENABLED_ROUTES = ['/api/admin/event', '/api/admin/record', '/api/admin/news', '/api/admin/article']`
- 未認証で保護 API にアクセスした場合は 403（JSON）、ページは `/login?redirect=...` へ

## API レスポンス規約

- フォーマットは `types/api.ts` の `ApiResponse<T>` に統一
- バリデーションエラー時は 422 + `ValidationErrorResponse`（`errors` を含む）
- フロントからの呼び出しは `BaseApiFetch` 経由を推奨（`requestWithJson`/`requestWithFormData`）

## 開発メモ

- Tailwind v4 は `@tailwindcss/vite` を Vite プラグインとして利用
- `astro-icon` + `@iconify-json/mdi` でアイコンを提供
- FullCalendar（`@fullcalendar/*`）は `optimizeDeps.exclude` に設定済み
- Holiday データはビルド時に `src/integrations/holiday.ts` で生成

## トラブルシュート

- DB 生成/マイグレーションに失敗する場合
  - `.env` の `DATABASE_URL` を確認
  - MySQL が起動しているか確認
  - `pnpm db:reset; pnpm db:migrate` を実行

- セッションが維持されない場合
  - `.env` の `SESSION_*` 値、`SESSION_REDIS_URL` を確認
  - Redis が起動しているか確認

- API でメッセージだけ返る/`data` が空
  - API は `{ success, data?, message?, errors? }` 形式。クライアントは `success` を見て分岐

## デプロイのヒント

- Node アダプタ（standalone）でビルドされるため、Node.js ランタイムと MySQL/Redis を用意
- 本番では Cookie/Secret は十分に長いランダム文字列へ変更し、HTTPS を使用

## ライセンス

本リポジトリに LICENSE は含まれていません。必要に応じてプロジェクト方針に合ったライセンスを追加してください。

## 参考リンク

- Astro: https://docs.astro.build
- Prisma: https://www.prisma.io/docs
- Tailwind CSS: https://tailwindcss.com/docs
- SWR: https://swr.vercel.app/
- Nanostores: https://nanostores.github.io/nanostores/