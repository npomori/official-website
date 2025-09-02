# Astro + Prisma Database Demo

Astro、Prisma、TailwindCSSを使用したデータベースアクセスのサンプルアプリケーション。

## 技術スタック

- [Astro](https://astro.build/) - コンテンツ駆動型Webサイトのためのフレームワーク
- [Prisma](https://www.prisma.io/) - モダンなデータベースORM
- [TailwindCSS v4](https://tailwindcss.com/) - ユーティリティファーストCSSフレームワーク
- [TypeScript](https://www.typescriptlang.org/) - 型安全性
- [MySQL](https://www.mysql.com/) - リレーショナルデータベース

## 機能

- 👥 **ユーザー管理**: ユーザーの作成・表示
- 📝 **投稿管理**: 投稿の作成・表示
- 🔗 **リレーションシップ**: ユーザーと投稿の関連付け
- 🎨 **モダンUI**: TailwindCSSによる美しいデザイン
- 📱 **レスポンシブ**: モバイル対応のレイアウト

## 必要要件

- Node.js v18.14.1以上
- pnpm v10.4.1以上
- MySQLサーバー（または他のデータベース）

## セットアップ

### 1. 依存関係のインストール

```bash
# リポジトリをクローン
git clone [リポジトリのURL]

# プロジェクトディレクトリに移動
cd astro-tailwind4-flowbite-db-starter-ex

# 依存関係のインストール
pnpm install
```

### 2. データベースの設定

`.env`ファイルを作成し、データベース接続情報を設定：

```env
DATABASE_URL="mysql://username:password@localhost:3306/database_name"
```

### 3. データベースの初期化

```bash
# Prismaクライアントの生成
pnpm db:generate

# データベースのマイグレーション
pnpm db:migrate

# データベースの確認（オプション）
pnpm db:studio
```

### 4. 開発サーバーの起動

```bash
pnpm dev
```

ブラウザで `http://localhost:3000` にアクセスしてアプリケーションを確認できます。

## 開発コマンド

```bash
# 開発サーバーの起動
pnpm dev

# プロダクションビルド
pnpm build

# ビルドのプレビュー
pnpm preview

# プロダクションサーバーの起動
pnpm start

# ESLintによるコード検証
pnpm lint

# Prisma関連コマンド
pnpm db:generate    # Prismaクライアントの生成
pnpm db:migrate     # データベースのマイグレーション
pnpm db:studio      # Prisma Studioの起動
pnpm db:reset       # データベースのリセット
```

## データベースモデル

### User（ユーザー）
- `id`: 主キー（自動増分）
- `email`: メールアドレス（ユニーク）
- `name`: 名前（オプション）
- `createdAt`: 作成日時
- `updatedAt`: 更新日時
- `posts`: 関連する投稿（1対多）

### Post（投稿）
- `id`: 主キー（自動増分）
- `title`: タイトル
- `content`: 内容（オプション）
- `published`: 公開状態
- `authorId`: 投稿者ID（外部キー）
- `createdAt`: 作成日時
- `updatedAt`: 更新日時
- `author`: 関連するユーザー（多対1）

## APIエンドポイント

- `GET /api/users` - ユーザー一覧の取得
- `POST /api/users` - ユーザーの作成
- `GET /api/posts` - 投稿一覧の取得
- `POST /api/posts` - 投稿の作成

## プロジェクト構造

```
├── src/
│   ├── lib/
│   │   └── prisma.ts          # Prismaクライアントの設定
│   ├── pages/
│   │   ├── api/
│   │   │   ├── users.ts       # ユーザーAPI
│   │   │   └── posts.ts       # 投稿API
│   │   └── index.astro        # メインページ（データベースデモ）
│   ├── layouts/
│   │   └── Layout.astro       # ページレイアウト
│   └── styles/
│       └── global.css         # グローバルスタイル
├── prisma/
│   └── schema.prisma          # データベーススキーマ
├── public/                    # 静的アセット
├── astro.config.mjs           # Astroの設定
├── tsconfig.json              # TypeScriptの設定
└── package.json               # プロジェクトの依存関係とスクリプト
```

## 使用方法

1. ブラウザで `http://localhost:3000` にアクセス
2. 左側の「ユーザー管理」セクションでユーザーを作成
3. 右側の「投稿管理」セクションで投稿を作成
4. 作成したユーザーと投稿がリアルタイムで表示されます

## トラブルシューティング

### データベース接続エラー
- `.env`ファイルの`DATABASE_URL`が正しく設定されているか確認
- データベースサーバーが起動しているか確認
- ファイアウォールの設定を確認

### Prismaクライアントエラー
```bash
pnpm db:generate
```

### マイグレーションエラー
```bash
pnpm db:reset
pnpm db:migrate
```

## 参考リンク

- [Prisma Documentation](https://www.prisma.io/docs)
- [Astro Documentation](https://docs.astro.build)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)

## ライセンス

MITライセンス

# Articleモデルのサンプルデータ

## 概要
Articleモデル用のサンプルデータを作成しました。MDXコンテンツとReactコンポーネントを組み合わせた実用的な記事データが含まれています。

## ファイル構成
- `prisma/seeds/articles.mjs`: メインの記事サンプルデータ（2件）
- `prisma/seeds/articles-additional.mjs`: 追加の記事サンプルデータ（3件）

## 実行コマンド
```bash
# 基本の記事データを挿入
pnpm run db:seed:articles

# 追加の記事データを挿入  
pnpm run db:seed:articles:additional
```

## 作成したサンプル記事

### 1. 森林ボランティア活動の始め方ガイド
- **スラッグ**: `forest-volunteer-guide`
- **カテゴリ**: ガイド
- **ステータス**: 公開
- **特徴**: 初心者向けの包括的なガイド
- **使用コンポーネント**: 
  - `ImageTextLayout`
  - `InfoCard` 
  - `MDXImage`
- **添付ファイル**: PDFガイド2件

### 2. 春の植樹活動レポート
- **スラッグ**: `spring-planting-report-2024`
- **カテゴリ**: 活動報告
- **ステータス**: 公開
- **特徴**: 詳細な活動レポート
- **使用コンポーネント**:
  - `MDXImage`
  - `ImageGallery`
  - `ImageTextLayout`
  - `InfoCard`
- **添付ファイル**: 報告書とExcelファイル

### 3. 森林保全の科学的アプローチ
- **スラッグ**: `scientific-approach-forest-conservation`
- **カテゴリ**: 技術・研究
- **ステータス**: 公開（会員限定）
- **特徴**: 最新技術を使った森林保全手法
- **使用コンポーネント**:
  - `ImageTextLayout`
  - `InfoCard`
  - `MDXImage`
  - `ImageGallery`
- **添付ファイル**: マニュアル、ツール、報告書

### 4. 森林ボランティア安全ガイドライン
- **スラッグ**: `safety-guidelines-forest-volunteer`
- **カテゴリ**: 安全管理
- **ステータス**: 公開
- **特徴**: 安全対策の包括的なガイド
- **使用コンポーネント**:
  - `ImageTextLayout`
  - `InfoCard`
  - `MDXImage`
  - `ImageGallery`
- **添付ファイル**: 安全マニュアル3件

### 5. 夏の森林整備計画（下書き）
- **スラッグ**: `summer-forest-maintenance-plan-draft`
- **カテゴリ**: 活動計画
- **ステータス**: 下書き
- **特徴**: 下書き状態のサンプル記事
- **使用コンポーネント**: なし（基本テキストのみ）
- **添付ファイル**: なし

## 特徴

### MDXコンテンツの活用
- フロントマター（YAML形式）でメタデータを定義
- 本文でReactコンポーネントを直接使用
- 画像、ギャラリー、レイアウトコンポーネントの組み合わせ

### データベースフィールドの活用
- **tags**: JSON配列でタグを管理
- **images**: 記事内で使用する画像ファイル名を配列で保存
- **attachments**: 添付ファイル名を配列で保存
- **downloadStats**: ファイルごとのダウンロード回数をJSONで記録
- **seoDescription/seoKeywords**: SEO対策用のメタデータ
- **isMemberOnly**: 会員限定コンテンツの判定
- **viewCount**: 閲覧回数のトラッキング

### ステータス管理
- **published**: 公開済み記事
- **draft**: 下書き記事
- **archived**: アーカイブ記事（将来的に使用予定）

### Reactコンポーネントの使用例
記事内で以下のカスタムコンポーネントを使用：
- `ImageTextLayout`: 画像とテキストのレイアウト
- `InfoCard`: 情報カードの表示
- `MDXImage`: カスタマイズ可能な画像表示
- `ImageGallery`: 複数画像のギャラリー表示

このサンプルデータにより、実際のWebサイトで使用する記事コンテンツの形式とReactコンポーネントの統合を確認できます。