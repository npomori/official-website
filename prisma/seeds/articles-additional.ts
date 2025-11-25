import { PrismaClient } from '@prisma/client'
import { runSeed } from './_common'

async function seedArticlesAdditional(prisma: PrismaClient) {
  console.log('追加の記事サンプルデータを挿入しています...')

  // 追加のサンプルデータを挿入
  const additionalArticlesData = [
    {
      title: '森林保全の科学的アプローチ',
      content: `

# 森林保全の科学的アプローチ

現代の森林保全活動では、科学的なデータと分析に基づいたアプローチが重要になっています。本記事では、最新の研究成果を活用した効果的な森林保全手法について解説します。

<ImageTextLayout 
  imageSrc="/images/forest-survey.jpg"
  imageAlt="森林調査の様子"
  title="データに基づく森林管理"
  imagePosition="left"
>
  GPS技術、リモートセンシング、GISを活用することで、従来では把握困難だった森林の詳細な状態を把握できるようになりました。これらの技術により、より効率的で効果的な保全計画を立てることが可能です。
</ImageTextLayout>

## 現代の森林調査技術

### リモートセンシング技術

  <InfoCard
    title="衛星画像解析"
    description="人工衛星から撮影した画像を解析し、森林の変化を監視"
    icon="🛰️"
    color="blue"
  />
  <InfoCard
    title="ドローン調査"
    description="無人航空機による詳細な森林状況の把握"
    icon="🚁"
    color="green"
  />
  <InfoCard
    title="LIDAR技術"
    description="レーザー光を用いた3次元森林構造の解析"
    icon="📡"
    color="purple"
  />

### 地上での精密調査

<MDXImage 
  src="/images/forest-maintenance.jpg" 
  alt="森林調査作業"
  size="large"
  caption="最新機器を使用した精密な森林調査"
/>

地上調査では、以下の項目を詳細に記録します：

- **樹種構成**: 各樹種の分布と密度
- **樹齢分布**: 森林の年齢構成の把握
- **健康状態**: 病害虫被害や枯損の状況
- **土壌条件**: pH、栄養状態、水分条件

## 科学的データの活用事例

### ケーススタディ1: 生物多様性の定量評価

<ImageTextLayout 
  imageSrc="/images/winter-nature.jpg"
  imageAlt="冬の森林"
  title="生物多様性指数の活用"
  imagePosition="right"
>
  シャノン多様度指数やシンプソン指数などを用いて、森林の生物多様性を定量的に評価しています。この指数により、保全活動の効果を客観的に測定することができます。
</ImageTextLayout>

### ケーススタディ2: 炭素固定量の計測

森林による二酸化炭素吸収量を正確に測定することで、気候変動対策における森林の役割を定量化しています。

<ImageGallery 
  images={[
    {
      src: "/images/album1.jpg",
      alt: "計測器具",
      caption: "炭素量測定器具"
    },
    {
      src: "/images/album2.jpg",
      alt: "データ収集",
      caption: "現地でのデータ収集"
    },
    {
      src: "/images/album3.jpg",
      alt: "分析結果",
      caption: "データ分析結果"
    }
  ]}
  columns={3}
/>

## 予測モデルの構築

### 機械学習の活用

最新のAI技術を活用して、以下の予測モデルを構築しています：

1. **森林成長予測モデル**: 植樹後の成長パターンを予測
2. **病害虫発生予測**: 気象条件から病害虫の発生を予測
3. **火災リスク評価**: 気候データから火災発生確率を算出

### データ可視化の重要性

<MDXImage 
  src="/images/participant1.jpg" 
  alt="データ分析"
  size="medium"
  align="left"
  caption="データ可視化による分析結果の共有"
/>

複雑な科学データを一般の方にも理解しやすい形で可視化することで、森林保全活動への理解と参加を促進しています。

## 市民科学の推進

### 参加型調査プログラム

  <InfoCard
    title="バードウォッチング調査"
    description="鳥類の種類と個体数を記録し、生態系の健全性を評価"
    icon="🐦"
    color="green"
  />
  <InfoCard
    title="植物フェノロジー調査"
    description="開花・結実時期を記録し、気候変動の影響を把握"
    icon="🌸"
    color="pink"
  />

### スマートフォンアプリの活用

市民参加型の調査では、専用のスマートフォンアプリを開発し、誰でも簡単にデータ収集に参加できる仕組みを構築しています。

## 今後の展望

<ImageTextLayout 
  imageSrc="/images/spring-planting.jpg"
  imageAlt="未来の森林"
  title="技術革新と森林保全"
  imagePosition="left"
>
  IoT技術の発展により、森林の状態をリアルタイムで監視するセンサーネットワークの構築が進んでいます。これにより、より迅速で的確な保全対策を実施できるようになります。
</ImageTextLayout>

### 期待される技術革新

- **5G通信**: 大容量データのリアルタイム伝送
- **エッジコンピューティング**: 現地での高速データ処理
- **ブロックチェーン**: データの信頼性確保

`,
      featuredImage: '/images/forest-survey.jpg',
      images: [
        'forest-survey.jpg',
        'forest-maintenance.jpg',
        'winter-nature.jpg',
        'album1.jpg',
        'album2.jpg',
        'album3.jpg',
        'participant1.jpg',
        'spring-planting.jpg'
      ],
      attachments: ['森林調査マニュアル.pdf', 'データ分析ツール.xlsx', '調査結果報告書.pdf'],
      tags: ['科学', '研究', '保全技術', 'データ分析', '予測モデル'],
      category: '技術・研究',
      status: 'published' as const,
      publishedAt: new Date('2024-02-15'),
      seoDescription:
        '最新の科学的手法を用いた効果的な森林保全活動について詳しく解説。リモートセンシング、機械学習、市民科学の活用事例を紹介。',
      seoKeywords: '森林保全,科学的アプローチ,リモートセンシング,データ分析,予測モデル',
      isMemberOnly: true,
      viewCount: 89,
      downloadStats: {
        '森林調査マニュアル.pdf': 15,
        'データ分析ツール.xlsx': 8,
        '調査結果報告書.pdf': 12
      },
      creatorId: 1
    },
    {
      title: '森林ボランティア安全ガイドライン',
      content: `

# 森林ボランティア安全ガイドライン

森林ボランティア活動における安全は最優先事項です。本ガイドラインでは、活動に参加する全ての方が安全に活動できるよう、基本的な安全対策と緊急時の対応について説明します。

## 基本的な安全方針

<ImageTextLayout 
  imageSrc="/images/forest-maintenance.jpg"
  imageAlt="安全装備を着用した活動"
  title="安全第一の活動"
  imagePosition="left"
>
  森林ボランティア活動では「安全第一」を基本方針とし、参加者全員の安全を確保することを最優先に考えています。適切な装備の着用、リーダーの指示の遵守、危険箇所の回避など、基本的な安全対策を徹底しています。
</ImageTextLayout>

## 必須安全装備

### 基本装備チェックリスト

  <InfoCard
    title="頭部保護"
    description="ヘルメット(作業用)の着用を義務付け"
    icon="⛑️"
    color="red"
  />
  <InfoCard
    title="手足の保護"
    description="作業用手袋と安全靴の着用"
    icon="🧤"
    color="blue"
  />
  <InfoCard
    title="身体保護"
    description="長袖・長ズボンで肌の露出を最小限に"
    icon="👔"
    color="green"
  />
  <InfoCard
    title="目の保護"
    description="必要に応じて保護メガネを着用"
    icon="🥽"
    color="orange"
  />

### 装備の点検方法

<MDXImage 
  src="/images/participant1.jpg" 
  alt="装備点検の様子"
  size="large"
  caption="活動前の装備点検は必須です"
/>

活動開始前に必ず以下の点検を実施してください：

1. **ヘルメット**: ひび割れや変形がないか確認
2. **手袋**: 破れや汚れがないか確認
3. **安全靴**: 靴底の摩耗状態を確認
4. **作業服**: 引っかかりやすい部分がないか確認

## 作業別安全対策

### 植樹作業の安全対策

<ImageTextLayout 
  imageSrc="/images/spring-planting.jpg"
  imageAlt="植樹作業"
  title="植樹作業での注意点"
  imagePosition="right"
>
  植樹作業では、スコップやクワなどの道具を使用します。周囲の人との距離を十分に保ち、道具の受け渡しは必ず手渡しで行います。また、苗木の運搬時は足元に注意し、無理な運搬は避けましょう。
</ImageTextLayout>

### 下草刈り作業の安全対策

下草刈りでは刈払機を使用することがあります。特に高い安全意識が必要です。

  <InfoCard
    title="機械操作"
    description="有資格者のみが操作。周囲15m以内立入禁止"
    icon="⚠️"
    color="red"
  />
  <InfoCard
    title="防護装備"
    description="フェイスガード、プロテクター着用必須"
    icon="🛡️"
    color="blue"
  />
  <InfoCard
    title="作業環境"
    description="視界良好、平坦地での作業に限定"
    icon="👁️"
    color="green"
  />

### 間伐作業の安全対策

<MDXImage 
  src="/images/forest-survey.jpg" 
  alt="間伐作業"
  size="medium"
  align="left"
  caption="間伐作業は特に高い技術と安全意識が必要"
/>

間伐作業は最も危険を伴う作業です：

- **有資格者限定**: チェーンソー講習修了者のみ
- **安全距離**: 作業者から半径20m以内立入禁止
- **倒木方向**: 事前に退避経路を確認
- **相互確認**: 作業者同士で常に位置を確認

## 危険な生物への対策

### スズメバチ対策

<ImageGallery 
  images={[
    {
      src: "/images/album1.jpg",
      alt: "スズメバチ注意看板",
      caption: "危険箇所の表示"
    },
    {
      src: "/images/album2.jpg",
      alt: "応急処置キット",
      caption: "応急処置用品の準備"
    }
  ]}
  columns={2}
/>

スズメバチの活動が活発な夏～秋にかけては特に注意が必要です：

- **予防**: 黒い服装を避け、香水等の使用を控える
- **発見時**: 静かにその場を離れる（手で払わない）
- **刺された場合**: 直ちに活動を中止し、応急処置を実施

### マムシ・ヤマカガシ対策

- **服装**: 長靴の着用を推奨
- **行動**: 草むらや岩陰は注意深く確認
- **応急処置**: 咬傷時は安静にし、直ちに医療機関へ

## 気象条件による活動制限

### 活動中止基準

  <InfoCard
    title="雨天時"
    description="降水確率50%以上で活動中止を検討"
    icon="🌧️"
    color="blue"
  />
  <InfoCard
    title="強風時"
    description="風速10m/s以上で活動中止"
    icon="💨"
    color="gray"
  />
  <InfoCard
    title="雷雨時"
    description="雷注意報発令時は即座に活動中止"
    icon="⚡"
    color="yellow"
  />
  <InfoCard
    title="猛暑時"
    description="気温35℃以上で活動時間短縮・中止"
    icon="🌡️"
    color="red"
  />

### 熱中症対策

<ImageTextLayout 
  imageSrc="/images/participant2.jpg"
  imageAlt="水分補給"
  title="こまめな水分補給"
  imagePosition="left"
>
  夏場の森林活動では熱中症のリスクが高まります。15分ごとの水分補給、日陰での休憩、体調の相互確認を徹底しています。体調に異変を感じたら、恥ずかしがらずに申し出ることが重要です。
</ImageTextLayout>

## 緊急時の対応

### 連絡体制

緊急時は以下の順序で連絡を行います：

1. **119番通報**（生命に関わる場合）
2. **リーダーへの報告**
3. **事務局への連絡**
4. **家族への連絡**

### 応急処置の基本

<MDXImage 
  src="/images/participant3.jpg" 
  alt="応急処置訓練"
  size="medium"
  align="right"
  caption="定期的な応急処置訓練を実施"
/>

すべてのリーダーは応急処置講習を受講しており、基本的な応急処置を行うことができます：

- **外傷**: 止血、清拭、包帯処置
- **骨折**: 固定、安静
- **意識障害**: 気道確保、回復体位
- **心肺停止**: 心肺蘇生法（AED使用）

## 安全教育・訓練

### 定期安全講習

年4回の安全講習を実施し、最新の安全情報を共有しています。

### 事故事例の共有

## まとめ

安全な森林ボランティア活動のために：

1. **適切な装備**: 必須装備の着用と点検
2. **基本ルール**: 安全ガイドラインの遵守
3. **相互確認**: 参加者同士での安全確認
4. **継続学習**: 定期的な安全教育への参加

`,
      featuredImage: '/images/forest-maintenance.jpg',
      images: [
        'forest-maintenance.jpg',
        'participant1.jpg',
        'spring-planting.jpg',
        'forest-survey.jpg',
        'album1.jpg',
        'album2.jpg',
        'participant2.jpg',
        'participant3.jpg'
      ],
      attachments: ['安全マニュアル完全版.pdf', '応急処置ガイド.pdf', '緊急連絡先一覧.pdf'],
      tags: ['安全', 'ガイドライン', 'リスク管理', '事故防止', '応急処置'],
      category: '安全管理',
      status: 'published' as const,
      publishedAt: new Date('2024-01-30'),
      seoDescription:
        '森林ボランティア活動における安全管理の基本方針と具体的な安全対策について詳しく解説。',
      seoKeywords: '森林ボランティア,安全ガイドライン,事故防止,応急処置,リスク管理',
      isMemberOnly: false,
      viewCount: 234,
      downloadStats: {
        '安全マニュアル完全版.pdf': 67,
        '応急処置ガイド.pdf': 43,
        '緊急連絡先一覧.pdf': 89
      },
      creatorId: 1
    },
    {
      title: '下書き：夏の森林整備計画',
      content: `

# 夏の森林整備計画

2024年夏季（6月～8月）に実施予定の森林整備活動について、以下の通り計画を策定いたします。

**※この記事は現在下書き状態です。内容は変更される可能性があります。**

## 活動期間・場所

- **期間**: 2024年6月1日～8月31日
- **場所**: ○○市森林公園 B・C区域
- **対象面積**: 約10ヘクタール

## 主な活動内容

### 下草刈り作業

梅雨明け後の7月中旬から本格的な下草刈りを実施予定です。

### 間伐作業

専門技術者による間伐作業を8月に実施予定です。

## 安全対策

夏場の活動では熱中症対策を重点的に実施します。

*（内容は検討中）*`,
      featuredImage: '/images/forest-maintenance.jpg',
      images: ['forest-maintenance.jpg'],
      attachments: [],
      tags: ['整備計画', '夏季活動', '下草刈り', '間伐'],
      category: '活動計画',
      status: 'draft' as const,
      publishedAt: null,
      seoDescription: '2024年夏季に実施予定の森林整備活動計画（下書き版）',
      seoKeywords: '森林整備,夏季活動,下草刈り,間伐',
      isMemberOnly: false,
      viewCount: 0,
      downloadStats: {},
      creatorId: 1
    }
  ]

  // データベースに挿入
  for (const articleData of additionalArticlesData) {
    await prisma.article.create({
      data: articleData
    })
  }

  console.log(`${additionalArticlesData.length}件の追加記事サンプルデータを挿入しました`)
}

runSeed('ArticlesAdditional', seedArticlesAdditional)
