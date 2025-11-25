import type { PrismaClient } from '@prisma/client'
import { runSeed } from './_common'

async function seedArticles(prisma: PrismaClient) {
  console.log('記事のサンプルデータを挿入しています...')

  // 既存の記事を削除
  await prisma.article.deleteMany()

  // サンプルデータを挿入
  const articlesData = [
    {
      title: '森林ボランティア活動の始め方ガイド',
      content: `

# 森林ボランティア活動の始め方ガイド

森林ボランティア活動に興味を持っていただき、ありがとうございます。このガイドでは、初めて森林ボランティア活動に参加する方のために、基本的な情報をまとめました。

<ImageTextLayout 
  imageSrc="/images/forest-survey.jpg"
  imageAlt="森林調査の様子"
  title="まずは森林について知ろう"
  imagePosition="left"
>
  森林ボランティア活動を始める前に、まず森林の役割や重要性について理解することが大切です。森林は生物多様性の保全、地球温暖化の防止、水源の涵養など、私たちの生活に欠かせない多くの機能を持っています。
</ImageTextLayout>

## 活動の種類

森林ボランティア活動には様々な種類があります。初心者の方でも参加しやすい活動から順に紹介します。

  <InfoCard
    title="森林散策・観察"
    description="季節ごとの森林の変化を観察し、動植物の生態を学びます。"
    icon="🌲"
    color="green"
  />
  <InfoCard
    title="下草刈り"
    description="森林の成長を促進するため、不要な下草を刈り取ります。"
    icon="✂️"
    color="blue"
  />
  <InfoCard
    title="植樹活動"
    description="苗木を植えて、新しい森林の創造に貢献します。"
    icon="🌱"
    color="orange"
  />
  <InfoCard
    title="間伐作業"
    description="森林の健康を保つため、適切な間伐を行います。"
    icon="🪓"
    color="red"
  />

## 必要な装備

安全で快適な活動のため、適切な装備を準備しましょう。

<MDXImage 
  src="/images/forest-maintenance.jpg" 
  alt="森林保全活動の様子"
  size="large"
  caption="適切な装備を身につけて安全に活動しましょう"
/>

### 基本装備

- **ヘルメット**: 頭部の保護
- **作業用手袋**: 手の保護
- **安全靴**: 足の保護
- **長袖・長ズボン**: 肌の保護

### あると便利な装備

- **雨具**: 天候の変化に対応
- **水筒**: 水分補給用
- **タオル**: 汗拭き用
- **救急用品**: 応急処置用

## 参加までの流れ

<ImageTextLayout 
  imageSrc="/images/spring-planting.jpg"
  imageAlt="春の植樹活動"
  title="まずは見学から"
  imagePosition="right"
>
  初めての方は、まず見学から始めることをおすすめします。実際の活動を見て、雰囲気を感じてから参加を決めることができます。不安な点があれば、スタッフにお気軽にお尋ねください。
</ImageTextLayout>

1. **情報収集**: ホームページやパンフレットで活動内容を確認
2. **見学申し込み**: まずは見学から始めましょう
3. **実際の見学**: 活動の雰囲気を体験
4. **参加申し込み**: 参加したい活動に申し込み
5. **活動開始**: いよいよ森林ボランティア活動スタート！

## よくある質問

**Q: 全くの初心者でも参加できますか？**

A: はい、大歓迎です。初心者向けの活動から始めていただけます。

**Q: 年齢制限はありますか？**

A: 18歳以上が基本ですが、保護者同伴であれば中学生以上から参加可能です。

**Q: 費用はかかりますか？**

A: 基本的に無料ですが、保険料として年間1,000円をお願いしています。
`,
      featuredImage: '/images/forest-survey.jpg',
      images: ['forest-survey.jpg', 'forest-maintenance.jpg', 'spring-planting.jpg'],
      attachments: ['初心者ガイド.pdf', '活動スケジュール.pdf'],
      tags: ['初心者', 'ガイド', '森林活動', '入門'],
      category: 'ガイド',
      status: 'published' as const,
      publishedAt: new Date('2024-03-20'),
      seoDescription:
        '森林ボランティア活動を始めたい方のための包括的なガイド。必要な装備、活動の種類、参加までの流れを詳しく解説。',
      seoKeywords: '森林ボランティア,初心者,ガイド,植樹,環境保全',
      isMemberOnly: false,
      viewCount: 285,
      downloadStats: {
        '初心者ガイド.pdf': 45,
        '活動スケジュール.pdf': 32
      },
      creatorId: 1
    },
    {
      title: '春の植樹活動レポート',
      content: `

# 春の植樹活動レポート

2024年4月15日、晴天に恵まれた中で春の植樹活動を実施しました。多くの皆様にご参加いただき、素晴らしい成果を上げることができました。

<MDXImage 
  src="/images/activity-planting-1.jpg" 
  alt="植樹活動の様子1"
  size="full"
  caption="2024年春の植樹活動 - 参加者全員で記念撮影"
/>

## 活動概要

- **日時**: 2024年4月15日(月)9:00-15:00
- **場所**: 〇〇市森林公園 A区域
- **参加者**: 45名(大人38名、子ども7名)
- **植樹本数**: 200本(クヌギ120本、コナラ80本)
- **天候**: 晴れ、気温18度

<ImageGallery 
  images={[
    {
      src: "/images/activity-planting-1.jpg",
      alt: "植樹活動1",
      caption: "苗木の植え付け作業"
    },
    {
      src: "/images/activity-planting-2.jpg",
      alt: "植樹活動2",
      caption: "参加者の皆さんで協力"
    },
    {
      src: "/images/spring-planting.jpg",
      alt: "春の植樹",
      caption: "丁寧に植え付け"
    }
  ]}
  columns={3}
/>

## 活動の流れ

### 9:00-9:30 受付・オリエンテーション

<ImageTextLayout 
  imageSrc="/images/participant1.jpg"
  imageAlt="参加者受付"
  title="朝のオリエンテーション"
  imagePosition="left"
>
  活動開始前に、安全についての説明と作業手順の確認を行いました。初参加の方も多く、和やかな雰囲気でスタートできました。今回は親子での参加も多く、子どもたちも熱心に説明を聞いていました。
</ImageTextLayout>

### 9:30-12:00 午前の植樹作業

午前中は主にクヌギの苗木120本を植樹しました。

<InfoCard
  title="植樹エリアA"
  description="クヌギ80本を植樹。初心者の方中心に作業"
  icon="🌳"
  color="green"
/>

<InfoCard
  title="植樹エリアB"
  description="クヌギ40本を植樹。経験者の方が指導"
  icon="🌲"
  color="blue"
/>

### 12:00-13:00 昼食・休憩

<MDXImage 
  src="/images/participant2.jpg" 
  alt="参加者昼食"
  size="medium"
  align="right"
  caption="みんなで楽しい昼食タイム"
/>

お弁当を持参いただき、森の中での昼食を楽しみました。参加者同士の交流も深まり、森林ボランティア活動についての情報交換も活発に行われました。

### 13:00-15:00 午後の植樹作業

午後はコナラの苗木80本を植樹しました。

<ImageTextLayout 
  imageSrc="/images/participant3.jpg"
  imageAlt="午後の作業"
  title="午後の植樹作業"
  imagePosition="left"
>
  午後は少し涼しくなり、作業もはかどりました。子どもたちも最後まで頑張って参加してくれました。植樹した苗木が大きく育つのが楽しみです。
</ImageTextLayout>

## 参加者の声

> 「初めての参加でしたが、皆さんが親切に教えてくださり、とても楽しく活動できました。」(30代女性)

> 「子どもと一緒に参加できて良かったです。自然の大切さを学ぶ良い機会になりました。」(40代男性)

> 「植樹した木が大きくなるのを見に来たいと思います。」(小学5年生)

## 成果と今後の予定

<ImageGallery 
  images={[
    {
      src: "/images/album1.jpg",
      alt: "植樹前",
      caption: "植樹前のエリア"
    },
    {
      src: "/images/album2.jpg",
      alt: "植樹後",
      caption: "植樹後のエリア"
    }
  ]}
  columns={2}
/>

今回の植樹活動により、約1.5ヘクタールのエリアに200本の苗木を植えることができました。

### 今後の管理計画

1. **1ヶ月後**: 苗木の活着状況確認
2. **3ヶ月後**: 下草刈り実施
3. **6ヶ月後**: 補植作業(必要に応じて)
4. **1年後**: 成長状況の詳細調査

## 次回活動のお知らせ

ご参加いただいた皆様、ありがとうございました。`,
      featuredImage: '/images/activity-planting-1.jpg',
      images: [
        'activity-planting-1.jpg',
        'activity-planting-2.jpg',
        'spring-planting.jpg',
        'participant1.jpg',
        'participant2.jpg',
        'participant3.jpg',
        'album1.jpg',
        'album2.jpg'
      ],
      attachments: ['植樹活動報告書.pdf', '参加者名簿.xlsx'],
      tags: ['植樹', '活動報告', '春', '2024年', 'イベント'],
      category: '活動報告',
      status: 'published' as const,
      publishedAt: new Date('2024-04-20'),
      seoDescription: '2024年春に実施した植樹活動の詳細レポート。45名が参加し、200本の苗木を植樹。',
      seoKeywords: '植樹活動,森林ボランティア,活動報告,クヌギ,コナラ',
      isMemberOnly: false,
      viewCount: 156,
      downloadStats: {
        '植樹活動報告書.pdf': 23,
        '参加者名簿.xlsx': 8
      },
      creatorId: 1
    }
  ]

  // データベースに挿入
  for (const articleData of articlesData) {
    await prisma.article.create({
      data: articleData
    })
  }

  console.log(`${articlesData.length}件の記事サンプルデータを挿入しました`)
}

runSeed('Articles', seedArticles)
