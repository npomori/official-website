import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('森林ボランティア活動のEventモデルサンプルデータを挿入しています...')

  // 既存のイベントを削除
  await prisma.event.deleteMany()

  // まず、ユーザーが存在するかチェックし、存在しない場合は作成
  const existingUser = await prisma.user.findFirst({
    where: {
      email: 'admin@example.com'
    }
  })

  let userId
  if (!existingUser) {
    const user = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: '管理者',
        password: '$2a$10$XLEGbbEKPN6WUHyV6Iv9zeT90nZTJl3uz4HPelKblOaQQgEicWijW',
        role: 'ADMIN'
      }
    })
    userId = user.id
  } else {
    userId = existingUser.id
  }

  // 今日の日付を基準に設定
  const today = new Date()
  const oneMonthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
  const threeMonthsLater = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000)

  // Eventモデルのサンプルデータを作成（森林ボランティア活動用）
  const sampleEvents = []

  // 過去のイベント（1か月前〜今日）
  sampleEvents.push(
    {
      title: '年末森林整備',
      description: '一年の締めくくりとして森林の整備を行います。来年に向けた準備も含みます。',
      url: 'https://example.com/events/year-end-maintenance',
      start: new Date(oneMonthAgo.getTime() + 5 * 24 * 60 * 60 * 1000), // 1か月前+5日（土曜日）
      end: new Date(oneMonthAgo.getTime() + 5 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
      isAllDay: false,
      categoryId: 'category1',
      creatorId: userId
    },
    {
      title: '森林ボランティア忘年会',
      description: '一年間の活動を振り返り、来年の活動について話し合う忘年会です。',
      url: 'https://example.com/events/volunteer-year-end',
      start: new Date(oneMonthAgo.getTime() + 12 * 24 * 60 * 60 * 1000), // 1か月前+12日（土曜日）
      end: new Date(oneMonthAgo.getTime() + 12 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      isAllDay: false,
      categoryId: 'category4',
      creatorId: userId
    },
    {
      title: '冬の森林観察会',
      description: '冬の森林の様子を観察します。雪の美しさと冬の生態系を学びます。',
      url: 'https://example.com/events/winter-observation',
      start: new Date(oneMonthAgo.getTime() + 19 * 24 * 60 * 60 * 1000), // 1か月前+19日（土曜日）
      end: new Date(oneMonthAgo.getTime() + 19 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
      isAllDay: false,
      categoryId: 'category4',
      creatorId: userId
    },
    {
      title: '森林整備活動',
      description: '落ち葉の除去、倒木の処理、散策路の整備を行います。',
      url: 'https://example.com/events/forest-maintenance',
      start: new Date(oneMonthAgo.getTime() + 26 * 24 * 60 * 60 * 1000), // 1か月前+26日（土曜日）
      end: new Date(oneMonthAgo.getTime() + 26 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
      isAllDay: false,
      categoryId: 'category1',
      creatorId: userId
    }
  )

  // 現在の月のイベント（今日〜1か月後）
  sampleEvents.push(
    {
      title: '新年森林観察会',
      description: '新年の森林の様子を観察します。冬の美しさと新年の希望を感じられる会です。',
      url: 'https://example.com/events/new-year-observation',
      start: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000), // 今日+3日（日曜日）
      end: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
      isAllDay: false,
      categoryId: 'category4',
      creatorId: userId
    },
    {
      title: '冬期森林整備活動',
      description:
        '落ち葉の除去、倒木の処理、散策路の整備を行います。野生動物の巣箱設置も予定しています。',
      url: 'https://example.com/events/winter-maintenance',
      start: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000), // 今日+10日（日曜日）
      end: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
      isAllDay: false,
      categoryId: 'category1',
      creatorId: userId
    },
    {
      title: '野生動物保護活動',
      description: '冬の寒さから野生動物を守るための巣箱設置と餌場の整備を行います。',
      url: 'https://example.com/events/wildlife-protection',
      start: new Date(today.getTime() + 17 * 24 * 60 * 60 * 1000), // 今日+17日（日曜日）
      end: new Date(today.getTime() + 17 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
      isAllDay: false,
      categoryId: 'category2',
      creatorId: userId
    },
    {
      title: '森林観察会',
      description: '冬の森林の生態系について学ぶ観察会です。専門家による解説付き。',
      url: 'https://example.com/events/forest-observation',
      start: new Date(today.getTime() + 24 * 24 * 60 * 60 * 1000), // 今日+24日（日曜日）
      end: new Date(today.getTime() + 24 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
      isAllDay: false,
      categoryId: 'category3',
      creatorId: userId
    }
  )

  // 来月のイベント（1か月後〜2か月後）
  sampleEvents.push(
    {
      title: '竹林整備作業',
      description: '古い竹の除去、新芽の保護、散策路の整備を行います。',
      url: 'https://example.com/events/bamboo-maintenance',
      start: new Date(today.getTime() + 32 * 24 * 60 * 60 * 1000), // 今日+32日（月曜日）
      end: new Date(today.getTime() + 32 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
      isAllDay: false,
      categoryId: 'category1',
      creatorId: userId
    },
    {
      title: '植樹準備作業',
      description: '春の植樹活動に向けて、植樹用の穴掘りと土壌整備を行います。',
      url: 'https://example.com/events/planting-preparation',
      start: new Date(today.getTime() + 39 * 24 * 60 * 60 * 1000), // 今日+39日（月曜日）
      end: new Date(today.getTime() + 39 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
      isAllDay: false,
      categoryId: 'category2',
      creatorId: userId
    },
    {
      title: '竹の生態学習会',
      description: '竹の生態について学ぶ学習会です。竹林の重要性についても解説します。',
      url: 'https://example.com/events/bamboo-ecology',
      start: new Date(today.getTime() + 46 * 24 * 60 * 60 * 1000), // 今日+46日（月曜日）
      end: new Date(today.getTime() + 46 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      isAllDay: false,
      categoryId: 'category3',
      creatorId: userId
    },
    {
      title: '早春の森林散策',
      description: '春の訪れを感じる森林散策です。まだ寒いですが、春の兆しを探してみましょう。',
      url: 'https://example.com/events/early-spring-walk',
      start: new Date(today.getTime() + 53 * 24 * 60 * 60 * 1000), // 今日+53日（月曜日）
      end: new Date(today.getTime() + 53 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
      isAllDay: false,
      categoryId: 'category1',
      creatorId: userId
    }
  )

  // 2か月後のイベント（2か月後〜3か月後）
  sampleEvents.push(
    {
      title: '春の植樹活動',
      description: '桜の苗木を植樹します。参加者全員で記念撮影も予定しています。',
      url: 'https://example.com/events/spring-planting',
      start: new Date(today.getTime() + 61 * 24 * 60 * 60 * 1000), // 今日+61日（火曜日）
      end: new Date(today.getTime() + 61 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
      isAllDay: false,
      categoryId: 'category2',
      creatorId: userId
    },
    {
      title: '海岸林再生プロジェクト',
      description: '海岸沿いの森林再生のための植樹活動です。防災機能も兼ねた植樹を行います。',
      url: 'https://example.com/events/coastal-forest',
      start: new Date(today.getTime() + 68 * 24 * 60 * 60 * 1000), // 今日+68日（火曜日）
      end: new Date(today.getTime() + 68 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000),
      isAllDay: false,
      categoryId: 'category2',
      creatorId: userId
    },
    {
      title: '森林ボランティア研修会',
      description: '新規参加者向けの研修会です。安全な活動方法と森林の基礎知識を学びます。',
      url: 'https://example.com/events/volunteer-training',
      start: new Date(today.getTime() + 75 * 24 * 60 * 60 * 1000), // 今日+75日（火曜日）
      end: new Date(today.getTime() + 75 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
      isAllDay: false,
      categoryId: 'category3',
      creatorId: userId
    },
    {
      title: '春分の日森林観察',
      description: '春分の日に森林の変化を観察します。春の訪れを感じられる特別な観察会です。',
      url: 'https://example.com/events/spring-equinox',
      start: new Date(today.getTime() + 82 * 24 * 60 * 60 * 1000), // 今日+82日（火曜日）
      end: new Date(today.getTime() + 82 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
      isAllDay: false,
      categoryId: 'category4',
      creatorId: userId
    }
  )

  // 3か月後のイベント（3か月後）
  sampleEvents.push(
    {
      title: '桜の開花観察会',
      description: '植樹した桜の開花状況を観察し、森林の春の変化を楽しみます。',
      url: 'https://example.com/events/cherry-blossom',
      start: new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000), // 今日+90日（水曜日）
      end: new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
      isAllDay: false,
      categoryId: 'category4',
      creatorId: userId
    },
    {
      title: '春の森林整備',
      description: '新芽が出始めた森林の整備作業です。下草刈りと散策路の整備を行います。',
      url: 'https://example.com/events/spring-maintenance',
      start: new Date(today.getTime() + 97 * 24 * 60 * 60 * 1000), // 今日+97日（水曜日）
      end: new Date(today.getTime() + 97 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
      isAllDay: false,
      categoryId: 'category1',
      creatorId: userId
    },
    {
      title: '野鳥観察会',
      description: '春の渡り鳥を観察する会です。双眼鏡の貸し出しもあります。',
      url: 'https://example.com/events/bird-watching',
      start: new Date(today.getTime() + 104 * 24 * 60 * 60 * 1000), // 今日+104日（水曜日）
      end: new Date(today.getTime() + 104 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      isAllDay: false,
      categoryId: 'category4',
      creatorId: userId
    },
    {
      title: '森林写真教室',
      description: '春の森林の美しさを写真に収める教室です。カメラの基本操作も学べます。',
      url: 'https://example.com/events/forest-photography',
      start: new Date(today.getTime() + 111 * 24 * 60 * 60 * 1000), // 今日+111日（水曜日）
      end: new Date(today.getTime() + 111 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
      isAllDay: false,
      categoryId: 'category3',
      creatorId: userId
    }
  )

  // 曜日をバラバラにするための追加イベント（木曜日、金曜日、土曜日）
  sampleEvents.push(
    {
      title: '初夏の森林散策',
      description: '新緑の美しい森林を散策します。森林浴効果も期待できます。',
      url: 'https://example.com/events/early-summer-walk',
      start: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // 今日+7日（木曜日）
      end: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
      isAllDay: false,
      categoryId: 'category1',
      creatorId: userId
    },
    {
      title: '森林害虫駆除活動',
      description: '森林の健康を保つための害虫駆除活動です。専門家の指導のもと実施します。',
      url: 'https://example.com/events/pest-control',
      start: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000), // 今日+14日（木曜日）
      end: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
      isAllDay: false,
      categoryId: 'category1',
      creatorId: userId
    },
    {
      title: '森林保全講演会',
      description: '森林保全の重要性について学ぶ講演会です。専門家による講演を予定しています。',
      url: 'https://example.com/events/forest-conservation-lecture',
      start: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000), // 今日+21日（木曜日）
      end: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      isAllDay: false,
      categoryId: 'category3',
      creatorId: userId
    },
    {
      title: '森林ボランティア交流会',
      description:
        'ボランティア同士の交流を深める会です。活動の振り返りと今後の計画を話し合います。',
      url: 'https://example.com/events/volunteer-meeting',
      start: new Date(today.getTime() + 28 * 24 * 60 * 60 * 1000), // 今日+28日（木曜日）
      end: new Date(today.getTime() + 28 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      isAllDay: false,
      categoryId: 'category1',
      creatorId: userId
    },
    {
      title: '梅雨時の森林観察',
      description: '雨に濡れた森林の様子を観察します。キノコの観察も予定しています。',
      url: 'https://example.com/events/rainy-season-observation',
      start: new Date(today.getTime() + 35 * 24 * 60 * 60 * 1000), // 今日+35日（木曜日）
      end: new Date(today.getTime() + 35 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
      isAllDay: false,
      categoryId: 'category4',
      creatorId: userId
    },
    {
      title: '夏の森林整備',
      description: '夏の暑さに備えた森林整備です。日陰の確保と散策路の整備を行います。',
      url: 'https://example.com/events/summer-maintenance',
      start: new Date(today.getTime() + 42 * 24 * 60 * 60 * 1000), // 今日+42日（木曜日）
      end: new Date(today.getTime() + 42 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
      isAllDay: false,
      categoryId: 'category1',
      creatorId: userId
    },
    {
      title: '森林昆虫観察会',
      description: '夏の森林に生息する昆虫を観察します。昆虫の生態についても学べます。',
      url: 'https://example.com/events/insect-observation',
      start: new Date(today.getTime() + 49 * 24 * 60 * 60 * 1000), // 今日+49日（木曜日）
      end: new Date(today.getTime() + 49 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
      isAllDay: false,
      categoryId: 'category4',
      creatorId: userId
    },
    {
      title: '森林ボランティア募集説明会',
      description: '新規ボランティア募集の説明会です。活動内容と参加方法について説明します。',
      url: 'https://example.com/events/volunteer-recruitment',
      start: new Date(today.getTime() + 56 * 24 * 60 * 60 * 1000), // 今日+56日（木曜日）
      end: new Date(today.getTime() + 56 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      isAllDay: false,
      categoryId: 'category2',
      creatorId: userId
    },
    {
      title: '夏の星空観察会',
      description: '森林での星空観察会です。光害の少ない場所で美しい星空を楽しめます。',
      url: 'https://example.com/events/stargazing',
      start: new Date(today.getTime() + 63 * 24 * 60 * 60 * 1000), // 今日+63日（木曜日）
      end: new Date(today.getTime() + 63 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      isAllDay: false,
      categoryId: 'category4',
      creatorId: userId
    },
    {
      title: '親子森林体験',
      description: '夏休み特別企画。親子で森林の楽しさを体験できるプログラムです。',
      url: 'https://example.com/events/family-forest-experience',
      start: new Date(today.getTime() + 70 * 24 * 60 * 60 * 1000), // 今日+70日（木曜日）
      end: new Date(today.getTime() + 70 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
      isAllDay: false,
      categoryId: 'category3',
      creatorId: userId
    },
    {
      title: '森林工作教室',
      description: '森林の材料を使った工作教室です。木の実や枝を使って作品を作ります。',
      url: 'https://example.com/events/forest-craft',
      start: new Date(today.getTime() + 77 * 24 * 60 * 60 * 1000), // 今日+77日（木曜日）
      end: new Date(today.getTime() + 77 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
      isAllDay: false,
      categoryId: 'category3',
      creatorId: userId
    },
    {
      title: '森林キャンプ',
      description: '森林でのキャンプ体験です。テント設営から自然観察まで楽しめます。',
      url: 'https://example.com/events/forest-camp',
      start: new Date(today.getTime() + 84 * 24 * 60 * 60 * 1000), // 今日+84日（木曜日）
      end: new Date(today.getTime() + 85 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000),
      isAllDay: true,
      categoryId: 'category4',
      creatorId: userId
    },
    {
      title: '夏の森林散策',
      description: '夏の森林を散策し、涼しさを感じながら自然を楽しみます。',
      url: 'https://example.com/events/summer-walk',
      start: new Date(today.getTime() + 91 * 24 * 60 * 60 * 1000), // 今日+91日（木曜日）
      end: new Date(today.getTime() + 91 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
      isAllDay: false,
      categoryId: 'category1',
      creatorId: userId
    },
    {
      title: '森林の恵み収穫体験',
      description: '森林の恵み（木の実、キノコなど）の収穫体験です。安全な収穫方法を学べます。',
      url: 'https://example.com/events/forest-harvest',
      start: new Date(today.getTime() + 98 * 24 * 60 * 60 * 1000), // 今日+98日（木曜日）
      end: new Date(today.getTime() + 98 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
      isAllDay: false,
      categoryId: 'category3',
      creatorId: userId
    },
    {
      title: '秋の森林観察準備',
      description: '秋の紅葉シーズンに向けた準備と観察ポイントの整備を行います。',
      url: 'https://example.com/events/autumn-preparation',
      start: new Date(today.getTime() + 105 * 24 * 60 * 60 * 1000), // 今日+105日（木曜日）
      end: new Date(today.getTime() + 105 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
      isAllDay: false,
      categoryId: 'category1',
      creatorId: userId
    },
    {
      title: '森林ボランティア感謝祭',
      description: '夏の活動を振り返り、ボランティアの皆さんに感謝を伝える会です。',
      url: 'https://example.com/events/volunteer-thanks',
      start: new Date(today.getTime() + 112 * 24 * 60 * 60 * 1000), // 今日+112日（木曜日）
      end: new Date(today.getTime() + 112 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      isAllDay: false,
      categoryId: 'category4',
      creatorId: userId
    }
  )

  // 金曜日のイベントを追加
  sampleEvents.push(
    {
      title: '金曜夜の森林観察',
      description: '金曜日の夜に森林の夜の様子を観察します。夜行性動物の観察も予定。',
      url: 'https://example.com/events/friday-night-observation',
      start: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000), // 今日+4日（金曜日）
      end: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      isAllDay: false,
      categoryId: 'category4',
      creatorId: userId
    },
    {
      title: '金曜森林整備',
      description: '金曜日の午後に森林整備を行います。週末に向けた準備作業です。',
      url: 'https://example.com/events/friday-maintenance',
      start: new Date(today.getTime() + 11 * 24 * 60 * 60 * 1000), // 今日+11日（金曜日）
      end: new Date(today.getTime() + 11 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      isAllDay: false,
      categoryId: 'category1',
      creatorId: userId
    },
    {
      title: '金曜森林学習会',
      description: '金曜日の夜に森林について学ぶ学習会です。リラックスした雰囲気で開催。',
      url: 'https://example.com/events/friday-learning',
      start: new Date(today.getTime() + 18 * 24 * 60 * 60 * 1000), // 今日+18日（金曜日）
      end: new Date(today.getTime() + 18 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      isAllDay: false,
      categoryId: 'category3',
      creatorId: userId
    }
  )

  // 終日イベントを追加
  sampleEvents.push(
    {
      title: '森林ボランティア研修合宿',
      description:
        '新規ボランティア向けの2日間の研修合宿です。森林の基礎知識と実践的な技術を学びます。',
      url: 'https://example.com/events/volunteer-training-camp',
      start: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000), // 今日+15日
      end: new Date(today.getTime() + 16 * 24 * 60 * 60 * 1000), // 今日+16日
      isAllDay: true,
      categoryId: 'category3',
      creatorId: userId
    },
    {
      title: '森林保全シンポジウム',
      description: '森林保全に関する専門家によるシンポジウムです。1日を通して様々な講演を予定。',
      url: 'https://example.com/events/forest-symposium',
      start: new Date(today.getTime() + 25 * 24 * 60 * 60 * 1000), // 今日+25日
      end: new Date(today.getTime() + 25 * 24 * 60 * 60 * 1000), // 同じ日
      isAllDay: true,
      categoryId: 'category3',
      creatorId: userId
    },
    {
      title: '森林フェスティバル',
      description: '森林の魅力を伝える1日限りのフェスティバルです。様々なイベントを開催。',
      url: 'https://example.com/events/forest-festival',
      start: new Date(today.getTime() + 40 * 24 * 60 * 60 * 1000), // 今日+40日
      end: new Date(today.getTime() + 40 * 24 * 60 * 60 * 1000), // 同じ日
      isAllDay: true,
      categoryId: 'category4',
      creatorId: userId
    },
    {
      title: '森林ボランティア大会',
      description: '全国の森林ボランティアが集まる大会です。3日間にわたって開催されます。',
      url: 'https://example.com/events/volunteer-conference',
      start: new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000), // 今日+60日
      end: new Date(today.getTime() + 62 * 24 * 60 * 60 * 1000), // 今日+62日
      isAllDay: true,
      categoryId: 'category2',
      creatorId: userId
    }
  )

  // 複数日にまたがるイベントを追加
  sampleEvents.push(
    {
      title: '森林調査プロジェクト',
      description: '森林の生態系調査を3日間にわたって実施します。専門家と一緒に調査を行います。',
      url: 'https://example.com/events/forest-survey-project',
      start: new Date(today.getTime() + 20 * 24 * 60 * 60 * 1000), // 今日+20日
      end: new Date(today.getTime() + 22 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000), // 今日+22日 18:00
      isAllDay: false,
      categoryId: 'category4',
      creatorId: userId
    },
    {
      title: '森林再生ワークショップ',
      description: '森林再生のためのワークショップです。2日間にわたって理論と実践を学びます。',
      url: 'https://example.com/events/forest-regeneration-workshop',
      start: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), // 今日+30日
      end: new Date(today.getTime() + 31 * 24 * 60 * 60 * 1000 + 17 * 60 * 60 * 1000), // 今日+31日 17:00
      isAllDay: false,
      categoryId: 'category2',
      creatorId: userId
    },
    {
      title: '森林ボランティアリーダー研修',
      description: 'ボランティアリーダーを目指す方向けの4日間の集中研修です。',
      url: 'https://example.com/events/volunteer-leader-training',
      start: new Date(today.getTime() + 50 * 24 * 60 * 60 * 1000), // 今日+50日
      end: new Date(today.getTime() + 53 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000), // 今日+53日 16:00
      isAllDay: false,
      categoryId: 'category3',
      creatorId: userId
    }
  )

  // 同じ日に複数のイベントがあるパターンを追加
  const sameDayEvents = [
    {
      title: '朝の森林散策',
      description: '朝の清々しい空気の中で森林を散策します。',
      url: 'https://example.com/events/morning-walk',
      start: new Date(today.getTime() + 8 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000), // 今日+8日 06:00
      end: new Date(today.getTime() + 8 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000), // 今日+8日 09:00
      isAllDay: false,
      categoryId: 'category1',
      creatorId: userId
    },
    {
      title: '午後の森林整備',
      description: '午後に森林整備作業を行います。',
      url: 'https://example.com/events/afternoon-maintenance',
      start: new Date(today.getTime() + 8 * 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000), // 今日+8日 13:00
      end: new Date(today.getTime() + 8 * 24 * 60 * 60 * 1000 + 17 * 60 * 60 * 1000), // 今日+8日 17:00
      isAllDay: false,
      categoryId: 'category1',
      creatorId: userId
    },
    {
      title: '夜の森林観察会',
      description: '夜の森林で夜行性動物を観察します。',
      url: 'https://example.com/events/night-observation',
      start: new Date(today.getTime() + 8 * 24 * 60 * 60 * 1000 + 19 * 60 * 60 * 1000), // 今日+8日 19:00
      end: new Date(today.getTime() + 8 * 24 * 60 * 60 * 1000 + 21 * 60 * 60 * 1000), // 今日+8日 21:00
      isAllDay: false,
      categoryId: 'category4',
      creatorId: userId
    }
  ]

  // 別の日にも同じ日に複数のイベントを追加
  const anotherSameDayEvents = [
    {
      title: '森林写真教室（午前）',
      description: '午前中の森林写真教室です。基本操作を学びます。',
      url: 'https://example.com/events/forest-photography-morning',
      start: new Date(today.getTime() + 16 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000), // 今日+16日 09:00
      end: new Date(today.getTime() + 16 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000), // 今日+16日 12:00
      isAllDay: false,
      categoryId: 'category3',
      creatorId: userId
    },
    {
      title: '森林工作教室（午後）',
      description: '午後の森林工作教室です。木の実や枝を使って作品を作ります。',
      url: 'https://example.com/events/forest-craft-afternoon',
      start: new Date(today.getTime() + 16 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000), // 今日+16日 14:00
      end: new Date(today.getTime() + 16 * 24 * 60 * 60 * 1000 + 17 * 60 * 60 * 1000), // 今日+16日 17:00
      isAllDay: false,
      categoryId: 'category3',
      creatorId: userId
    },
    {
      title: '森林ボランティア交流会（夜）',
      description: '夜の森林ボランティア交流会です。リラックスした雰囲気で開催。',
      url: 'https://example.com/events/volunteer-meeting-night',
      start: new Date(today.getTime() + 16 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000), // 今日+16日 18:00
      end: new Date(today.getTime() + 16 * 24 * 60 * 60 * 1000 + 20 * 60 * 60 * 1000), // 今日+16日 20:00
      isAllDay: false,
      categoryId: 'category4',
      creatorId: userId
    }
  ]

  // すべてのイベントを配列に追加
  sampleEvents.push(...sameDayEvents, ...anotherSameDayEvents)

  // データベースに挿入
  for (const event of sampleEvents) {
    await prisma.event.create({
      data: event
    })
  }

  console.log(`${sampleEvents.length}件のイベントデータを挿入しました。`)
  console.log(
    `期間: ${oneMonthAgo.toLocaleDateString('ja-JP')} 〜 ${threeMonthsLater.toLocaleDateString('ja-JP')}`
  )
  console.log('イベントパターン:')
  console.log('- 曜日がバラバラのイベント（月〜日）')
  console.log('- 終日イベント（1日〜3日間）')
  console.log('- 複数日にまたがるイベント（2日〜4日間）')
  console.log('- 同じ日に複数のイベントがあるパターン')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
