# Copilot Instructions for official-website

このドキュメントは本リポジトリ向けに GitHub Copilot へ伝える前提・規約・生成方針を要約したものです。提案や自動生成時は以下を強く優先してください。

## 技術スタックとランタイム
- フレームワーク: `Astro v5`（Hybrid SSR/CSR）、`@astrojs/react`
- 言語: `TypeScript`（`astro/tsconfigs/strict` を継承）
- フロント: React 19（`react`/`react-dom`）、SWR 2、Nanostores
- スタイル: Tailwind CSS 4（`@tailwindcss/vite`、`prettier-plugin-tailwindcss`）
- サーバ/API: Astro Middleware + API Routes（`src/middleware/*`, `src/pages/api/*`）
- 認証/セッション: Redis セッション（`ioredis`）+ Cookie（Remember Me）
- DB: Prisma + MySQL（`prisma/schema.prisma`）
- 画像/MDX: `@mdx-js/*`、`react-markdown`、`rehype-*`、`remark-gfm`

## ディレクトリ構成（要点）
- `src/pages/*` … Astro ページと API ルート（`/api/**`）
- `src/components/*` … React/TSX コンポーネント
- `src/fetch/*` … クライアントからの API 呼び出しラッパ（`BaseApiFetch` 等）
- `src/hooks/swr.ts` … SWR の共通 `fetcher` を提供
- `src/middleware/*` … `auth` などのグローバルミドルウェア
- `src/server/*` … サーバサイドの util / config
- `src/store/*` … Nanostores によるクライアント状態
- `prisma/*` … Prisma スキーマ、マイグレーション、シード

## 型とコード規約
- TS 設定は厳格。`noUnusedLocals`/`noUnusedParameters` を満たすこと。
- パス解決は `@/*` を使用（`tsconfig.json` の `baseUrl: ./src`）。相対 `../../` は避ける。
- ディレクトリへのアクセスは `process.cwd()` を基準にしてください。
- UI は React Function Component + hooks。副作用は最小限に。
- CSS は Tailwind を基本に、ユーティリティは `tailwind-merge` を使用可。
- API レスポンスは `types/api.ts` の `ApiResponse<T>` 形式を優先（`{ success, data?, message?, errors? }`）。
- フロントからのフェッチは `BaseApiFetch` 経由を推奨。JSON は `requestWithJson`、ファイルは `requestWithFormData`。
- SWR を使う際は `src/hooks/swr.ts` の `fetcher` を使う。`result.success === true ? result.data : result` で後方互換を担保済み。

## 認証・権限
- グローバルミドルウェア `src/middleware/auth.ts` が `context.locals.user` と `context.locals.session` を設定。
- アクセス制御:
  - 保護対象: `config.PROTECTED_ROUTES`（例: `/admin`, `/api/admin`, `/api/member`）
  - Editor 許可: `config.EDITOR_ENABLED_ROUTES`（例: `/api/admin/event`, `/api/admin/record`, `/api/admin/news`）
  - 未認証で保護 API へアクセス時は `403` JSON。ページは `/login?redirect=...` へ。

## DB モデル（抜粋）
- `User`（role: `ADMIN`/`MODERATOR`/`EDITOR`/その他）
- `Event`/`Comment`/`Record`/`News`/`Article`
- `Article.content` は MDX を想定。`images`, `attachments`, `tags` などは JSON で保存。

## よく使うパターン
- API 実装
  - 返却は `ApiResponse<T>` を徹底。422 の場合は `ValidationErrorResponse` として `errors` を含める。
  - API ルートは `/api/admin/**` と `/api/member/**` の保護を意識。
- クライアントからの呼び出し
  - `BaseApiFetch.request|requestWithJson|requestWithFormData` を使用。
  - SWR の `fetcher` を流用し、`useSWR(key, fetcher)` の形で使用。
- ページ保護
  - Astro ページで `locals.user` の有無により UI を出し分け。必要に応じてリダイレクト。
- Content Collections
  - `src/content/config.ts` に定義済み。`draft` は既定 false。記事一覧/UI では draft をフィルタ。

## データベースアクセス指針
- Prisma の操作は必ず `BaseDB` を継承した専用 DB クラス経由で実行する。
- DB クラスの各メソッドは以下のいずれかのパターンで値を返す。
  - `値 | null`
  - `値[]`
  - `boolean`

## 生成時のアンチパターン（避けるべきこと）
- 相対パスの深い import（`../../..`）→ `@/*` を使う。
- API レスポンス形式のばらつき→ `ApiResponse<T>` に統一。
- 認証をバイパスする直アクセスや、保護ルートでの未チェック。
- クライアントで Prisma を直接参照すること（サーバ側限定）。
- 画像や uploads への直書き込みパスの固定。サーバ/API を経由する実装を優先。

## コーディング規約（補足）
- ESLint/Prettier に準拠。Tailwind クラスは可能なら論理順で並べ替え。
- コンポーネントは小さく、関数引数と戻り値に型を付与。
- エラーメッセージは日本語でユーザ向けに分かりやすく。

## 実装タスクのテンプレ（Copilot への指示例）
- 新しい API を追加する場合:
  1) `src/pages/api/...` にハンドラを作成し `ApiResponse<T>` を返却
  2) 認証が必要なら `PROTECTED_ROUTES` 配下へ配置し `auth` ミドルウェアで保護
  3) クライアントは `BaseApiFetch` から呼び出す
- React UI を追加する場合:
  1) `src/components/**` に TSX で作成
  2) スタイルは Tailwind、状態は必要に応じて SWR/Nanostores
  3) `@/*` のパスエイリアスを使う

---
本ドキュメントはリポジトリの「生成ガイドライン」です。提案がこれに反する場合は修正案を提示してください。