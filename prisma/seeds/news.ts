import type { PrismaClient } from '../../src/generated/prisma/client'
import { runSeed } from './_common'

async function seedNews(prisma: PrismaClient): Promise<void> {
  console.log('お知らせのサンプルデータを挿入しています...')

  // 既存のお知らせを削除
  await prisma.news.deleteMany()

  // サンプルデータを挿入
  const newsData = [
    {
      title: '2024年度の活動計画を公開しました',
      content:
        '2024年度の森林ボランティア活動計画を公開いたします。今年度は植樹活動、森林整備、環境教育など、より多くの活動を予定しています。詳細は添付のPDFファイルをご確認ください。',
      date: new Date('2024-03-20'),
      categories: ['office'],
      priority: 'important',
      attachments: ['2024年度活動計画.pdf'],
      author: '事務局',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '森林大学の受講生を募集しています',
      content:
        '日本森林ボランティア協会主催の森林大学の受講生を募集いたします。森林の基礎知識から実践的な技術まで、体系的に学べる講座です。定員30名、先着順となります。',
      date: new Date('2024-03-15'),
      categories: ['recruitment', 'training'],
      priority: null,
      attachments: ['森林大学募集要項.pdf', '申込書.docx'],
      author: '教育担当',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: 'ボランティア保険の更新について',
      content:
        '森林ボランティア活動保険の更新手続きについてお知らせします。2024年度の保険更新は3月末までとなっております。未更新の方は早めに手続きをお願いいたします。',
      date: new Date('2024-03-10'),
      categories: ['insurance'],
      priority: 'urgent',
      attachments: ['保険更新手続き.pdf'],
      author: '事務局',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '春の植樹祭の参加者募集',
      content:
        '4月15日に開催予定の春の植樹祭の参加者を募集いたします。クヌギとコナラの苗木を植樹し、森林の再生に取り組みます。初心者の方も大歓迎です。',
      date: new Date('2024-03-05'),
      categories: ['event', 'recruitment'],
      priority: null,
      attachments: ['植樹祭案内.pdf'],
      author: 'イベント担当',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '事務局の営業時間変更のお知らせ',
      content:
        '4月1日より事務局の営業時間を変更いたします。平日9:00-17:00(土日祝日休み)となります。ご不便をおかけしますが、ご理解いただけますようお願いいたします。',
      date: new Date('2024-02-28'),
      categories: ['office'],
      priority: null,
      attachments: [],
      author: '事務局',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '新入会員歓迎会の開催',
      content:
        '新しく入会された会員の皆様を対象とした歓迎会を開催いたします。森林ボランティア活動の概要説明や、先輩会員との交流の場を設けます。',
      date: new Date('2024-02-20'),
      categories: ['event', 'member'],
      priority: null,
      attachments: ['歓迎会案内.pdf'],
      author: '会員担当',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '安全講習会の開催',
      content:
        '森林ボランティア活動における安全講習会を開催いたします。チェーンソーの使用方法、安全装備の着用方法など、安全な活動に必要な知識を学べます。',
      date: new Date('2024-02-15'),
      categories: ['training'],
      priority: 'confirmation',
      attachments: ['安全講習会案内.pdf'],
      author: '安全担当',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '会報誌「森の声」第50号発行',
      content:
        '会報誌「森の声」第50号を発行いたしました。特集は「森林ボランティア活動の10年」です。会員の皆様には郵送にてお届けいたします。',
      date: new Date('2024-02-10'),
      categories: ['newsletter'],
      priority: null,
      attachments: ['森の声50号.pdf'],
      author: '編集部',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '森林調査ボランティア募集',
      content:
        '森林の現状調査を行うボランティアを募集いたします。樹木の種類、密度、健康状態などを記録し、森林管理の基礎データを収集します。',
      date: new Date('2024-02-05'),
      categories: ['recruitment', 'regular_activity'],
      priority: null,
      attachments: ['調査ボランティア募集.pdf'],
      author: '調査担当',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: 'チェーンソー講習会の開催',
      content:
        'チェーンソーの安全な使用方法を学ぶ講習会を開催いたします。初心者向けの基礎コースと、経験者向けの上級コースがあります。',
      date: new Date('2024-01-30'),
      categories: ['training'],
      priority: null,
      attachments: ['チェーンソー講習会案内.pdf'],
      author: '技術担当',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '冬の森林整備活動報告',
      content:
        '1月に行った冬の森林整備活動の報告をいたします。枯れ枝の除去、倒木の処理などを行い、森林の安全性を向上させました。',
      date: new Date('2024-01-25'),
      categories: ['regular_activity'],
      priority: null,
      attachments: ['冬の整備活動報告.pdf'],
      author: '活動担当',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '会員証の更新について',
      content:
        '2024年度の会員証更新手続きについてお知らせします。新しい会員証は3月末までに郵送いたします。住所変更がある方は早めにお知らせください。',
      date: new Date('2024-01-20'),
      categories: ['office'],
      priority: null,
      attachments: ['会員証更新手続き.pdf'],
      author: '事務局',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '森林観察会の開催',
      content:
        '冬の森林を観察する会を開催いたします。冬芽の観察、野鳥の観察など、冬ならではの森林の魅力を体験できます。',
      date: new Date('2024-01-15'),
      categories: ['event', 'public'],
      priority: null,
      attachments: ['森林観察会案内.pdf'],
      author: '自然観察担当',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '年次総会の開催',
      content:
        '2023年度年次総会を開催いたします。活動報告、決算報告、役員選挙などを行います。会員の皆様のご参加をお待ちしております。',
      date: new Date('2024-01-10'),
      categories: ['office', 'member'],
      priority: 'important',
      attachments: ['年次総会案内.pdf'],
      author: '事務局',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '森林ボランティア養成講座',
      content:
        '森林ボランティアとして活動するための基礎知識を学ぶ養成講座を開催いたします。全6回の講座で、森林の基礎から実践まで学べます。',
      date: new Date('2024-01-05'),
      categories: ['training', 'recruitment'],
      priority: null,
      attachments: ['養成講座案内.pdf'],
      author: '教育担当',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '年末年始の事務局休業',
      content:
        '年末年始の事務局休業についてお知らせします。12月29日から1月3日まで休業いたします。緊急の場合はメールにてご連絡ください。',
      date: new Date('2023-12-25'),
      categories: ['office'],
      priority: null,
      attachments: [],
      author: '事務局',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: 'クリスマス植樹イベント',
      content:
        'クリスマスに合わせて植樹イベントを開催いたします。家族連れでも参加しやすいイベントです。記念品もご用意しております。',
      date: new Date('2023-12-20'),
      categories: ['event', 'public'],
      priority: null,
      attachments: ['クリスマス植樹案内.pdf'],
      author: 'イベント担当',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '森林保護活動の成果報告',
      content:
        '2023年度の森林保護活動の成果を報告いたします。植樹本数、整備面積、参加者数など、具体的な成果をご確認いただけます。',
      date: new Date('2023-12-15'),
      categories: ['regular_activity'],
      priority: null,
      attachments: ['2023年度成果報告.pdf'],
      author: '活動担当',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '冬の安全講習会',
      content:
        '冬の森林ボランティア活動における安全講習会を開催いたします。凍結路面での作業、寒さ対策など、冬特有の注意点を学べます。',
      date: new Date('2023-12-10'),
      categories: ['training'],
      priority: 'confirmation',
      attachments: ['冬の安全講習会案内.pdf'],
      author: '安全担当',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '会報誌「森の声」第49号発行',
      content:
        '会報誌「森の声」第49号を発行いたしました。特集は「冬の森林の魅力」です。会員の皆様には郵送にてお届けいたします。',
      date: new Date('2023-12-05'),
      categories: ['newsletter'],
      priority: null,
      attachments: ['森の声49号.pdf'],
      author: '編集部',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '森林整備ボランティア募集',
      content:
        '森林整備活動を行うボランティアを募集いたします。下草刈り、枝打ち、間伐などの作業を行います。経験は問いません。',
      date: new Date('2023-11-30'),
      categories: ['recruitment', 'regular_activity'],
      priority: null,
      attachments: ['整備ボランティア募集.pdf'],
      author: '活動担当',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '秋の森林観察会',
      content:
        '秋の森林を観察する会を開催いたします。紅葉の観察、秋の実りの観察など、秋ならではの森林の魅力を体験できます。',
      date: new Date('2023-11-25'),
      categories: ['event', 'public'],
      priority: null,
      attachments: ['秋の森林観察会案内.pdf'],
      author: '自然観察担当',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '森林ボランティア保険の更新',
      content:
        '森林ボランティア活動保険の更新手続きについてお知らせします。2024年度の保険更新は12月末までとなっております。',
      date: new Date('2023-11-20'),
      categories: ['insurance'],
      priority: 'urgent',
      attachments: ['保険更新手続き.pdf'],
      author: '事務局',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '森林技術講習会',
      content:
        '森林作業に必要な技術を学ぶ講習会を開催いたします。ロープワーク、安全装備の使用方法など、実践的な技術を習得できます。',
      date: new Date('2023-11-15'),
      categories: ['training'],
      priority: null,
      attachments: ['技術講習会案内.pdf'],
      author: '技術担当',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '秋の植樹祭の報告',
      content:
        '10月に開催した秋の植樹祭の報告をいたします。多くの方にご参加いただき、100本の苗木を植樹することができました。',
      date: new Date('2023-11-10'),
      categories: ['event'],
      priority: null,
      attachments: ['秋の植樹祭報告.pdf'],
      author: 'イベント担当',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '森林環境教育プログラム',
      content:
        '子どもたちを対象とした森林環境教育プログラムを開催いたします。森林の大切さを楽しく学べるプログラムです。',
      date: new Date('2023-11-05'),
      categories: ['training', 'public'],
      priority: null,
      attachments: ['環境教育プログラム案内.pdf'],
      author: '教育担当',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '会員交流会の開催',
      content:
        '会員同士の交流を深める交流会を開催いたします。活動の感想や意見交換の場を設けます。軽食もご用意しております。',
      date: new Date('2023-10-30'),
      categories: ['event', 'member'],
      priority: null,
      attachments: ['交流会案内.pdf'],
      author: '会員担当',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '森林調査結果の報告',
      content:
        '夏に行った森林調査の結果を報告いたします。樹木の成長状況、病虫害の発生状況など、詳細な調査結果をご確認いただけます。',
      date: new Date('2023-10-25'),
      categories: ['regular_activity'],
      priority: null,
      attachments: ['森林調査結果.pdf'],
      author: '調査担当',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '安全装備の点検について',
      content:
        '森林ボランティア活動で使用する安全装備の点検についてお知らせします。ヘルメット、安全靴、作業服などの点検を行います。',
      date: new Date('2023-10-20'),
      categories: ['training'],
      priority: 'important',
      attachments: ['安全装備点検案内.pdf'],
      author: '安全担当',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '森林ボランティア体験会',
      content:
        '森林ボランティア活動を体験できる会を開催いたします。初心者の方も気軽に参加できる体験会です。',
      date: new Date('2023-10-15'),
      categories: ['event', 'public'],
      priority: null,
      attachments: ['体験会案内.pdf'],
      author: 'イベント担当',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '会報誌「森の声」第48号発行',
      content:
        '会報誌「森の声」第48号を発行いたしました。特集は「秋の森林の魅力」です。会員の皆様には郵送にてお届けいたします。',
      date: new Date('2023-10-10'),
      categories: ['newsletter'],
      priority: null,
      attachments: ['森の声48号.pdf'],
      author: '編集部',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '森林整備技術講習会',
      content:
        '森林整備に必要な技術を学ぶ講習会を開催いたします。間伐、枝打ち、下草刈りなどの技術を習得できます。',
      date: new Date('2023-10-05'),
      categories: ['training', 'recruitment'],
      priority: null,
      attachments: ['整備技術講習会案内.pdf'],
      author: '技術担当',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '夏の森林観察会',
      content:
        '夏の森林を観察する会を開催いたします。夏の花々、昆虫、野鳥など、夏ならではの森林の魅力を体験できます。',
      date: new Date('2023-09-30'),
      categories: ['event', 'public'],
      priority: null,
      attachments: ['夏の森林観察会案内.pdf'],
      author: '自然観察担当',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '森林ボランティア募集',
      content:
        '森林ボランティアを募集いたします。森林の整備、植樹、観察など、様々な活動に参加できます。経験は問いません。',
      date: new Date('2023-09-25'),
      categories: ['recruitment', 'public'],
      priority: null,
      attachments: ['ボランティア募集.pdf'],
      author: '会員担当',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '夏の安全講習会',
      content:
        '夏の森林ボランティア活動における安全講習会を開催いたします。熱中症対策、虫刺され対策など、夏特有の注意点を学べます。',
      date: new Date('2023-09-20'),
      categories: ['training'],
      priority: 'confirmation',
      attachments: ['夏の安全講習会案内.pdf'],
      author: '安全担当',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '森林保護活動の報告',
      content:
        '夏に行った森林保護活動の報告をいたします。下草刈り、枝打ち、間伐など、様々な活動を行いました。',
      date: new Date('2023-09-15'),
      categories: ['regular_activity'],
      priority: null,
      attachments: ['夏の保護活動報告.pdf'],
      author: '活動担当',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '森林環境学習会',
      content:
        '森林の環境について学ぶ学習会を開催いたします。森林の役割、生態系の重要性など、環境について深く学べます。',
      date: new Date('2023-09-10'),
      categories: ['training'],
      priority: null,
      attachments: ['環境学習会案内.pdf'],
      author: '教育担当',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '会員証の再発行について',
      content:
        '会員証の再発行についてお知らせします。紛失や破損された場合は、事務局までご連絡ください。手数料は無料です。',
      date: new Date('2023-09-05'),
      categories: ['office'],
      priority: null,
      attachments: ['会員証再発行手続き.pdf'],
      author: '事務局',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '森林整備ボランティア募集',
      content:
        '森林整備活動を行うボランティアを募集いたします。下草刈り、枝打ち、間伐などの作業を行います。',
      date: new Date('2023-08-30'),
      categories: ['recruitment'],
      priority: null,
      attachments: ['整備ボランティア募集.pdf'],
      author: '活動担当',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '夏の植樹活動',
      content:
        '夏の植樹活動を開催いたします。暑さ対策を万全に行い、安全に植樹活動を行います。水分補給も十分に行います。',
      date: new Date('2023-08-25'),
      categories: ['event', 'regular_activity'],
      priority: null,
      attachments: ['夏の植樹活動案内.pdf'],
      author: 'イベント担当',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '森林調査ボランティア募集',
      content:
        '森林の現状調査を行うボランティアを募集いたします。樹木の種類、密度、健康状態などを記録します。',
      date: new Date('2023-08-20'),
      categories: ['recruitment', 'regular_activity'],
      priority: null,
      attachments: ['調査ボランティア募集.pdf'],
      author: '調査担当',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '会報誌「森の声」第47号発行',
      content:
        '会報誌「森の声」第47号を発行いたしました。特集は「夏の森林の魅力」です。会員の皆様には郵送にてお届けいたします。',
      date: new Date('2023-08-15'),
      categories: ['newsletter'],
      priority: null,
      attachments: ['森の声47号.pdf'],
      author: '編集部',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '森林技術講習会',
      content:
        '森林作業に必要な技術を学ぶ講習会を開催いたします。ロープワーク、安全装備の使用方法など、実践的な技術を習得できます。',
      date: new Date('2023-08-10'),
      categories: ['training'],
      priority: null,
      attachments: ['技術講習会案内.pdf'],
      author: '技術担当',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '森林観察会の開催',
      content:
        '森林を観察する会を開催いたします。樹木の観察、野鳥の観察など、森林の魅力を体験できます。',
      date: new Date('2023-08-05'),
      categories: ['event', 'public'],
      priority: null,
      attachments: ['森林観察会案内.pdf'],
      author: '自然観察担当',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '森林ボランティア保険の更新',
      content:
        '森林ボランティア活動保険の更新手続きについてお知らせします。2023年度の保険更新は8月末までとなっております。',
      date: new Date('2023-07-30'),
      categories: ['insurance'],
      priority: 'urgent',
      attachments: ['保険更新手続き.pdf'],
      author: '事務局',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '森林整備活動の報告',
      content:
        '7月に行った森林整備活動の報告をいたします。下草刈り、枝打ち、間伐など、様々な活動を行いました。',
      date: new Date('2023-07-25'),
      categories: ['regular_activity'],
      priority: null,
      attachments: ['7月整備活動報告.pdf'],
      author: '活動担当',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '森林環境教育プログラム',
      content:
        '子どもたちを対象とした森林環境教育プログラムを開催いたします。森林の大切さを楽しく学べるプログラムです。',
      date: new Date('2023-07-20'),
      categories: ['training'],
      priority: null,
      attachments: ['環境教育プログラム案内.pdf'],
      author: '教育担当',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '会員交流会の開催',
      content:
        '会員同士の交流を深める交流会を開催いたします。活動の感想や意見交換の場を設けます。軽食もご用意しております。',
      date: new Date('2023-07-15'),
      categories: ['event', 'member'],
      priority: null,
      attachments: ['交流会案内.pdf'],
      author: '会員担当',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '森林調査結果の報告',
      content:
        '春に行った森林調査の結果を報告いたします。樹木の成長状況、病虫害の発生状況など、詳細な調査結果をご確認いただけます。',
      date: new Date('2023-07-10'),
      categories: ['regular_activity'],
      priority: null,
      attachments: ['春の森林調査結果.pdf'],
      author: '調査担当',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '安全装備の点検について',
      content:
        '森林ボランティア活動で使用する安全装備の点検についてお知らせします。ヘルメット、安全靴、作業服などの点検を行います。',
      date: new Date('2023-07-05'),
      categories: ['training'],
      priority: 'important',
      attachments: ['安全装備点検案内.pdf'],
      author: '安全担当',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '森林ボランティア体験会',
      content:
        '森林ボランティア活動を体験できる会を開催いたします。初心者の方も気軽に参加できる体験会です。',
      date: new Date('2023-06-30'),
      categories: ['event', 'public'],
      priority: null,
      attachments: ['体験会案内.pdf'],
      author: 'イベント担当',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '会報誌「森の声」第46号発行',
      content:
        '会報誌「森の声」第46号を発行いたしました。特集は「春の森林の魅力」です。会員の皆様には郵送にてお届けいたします。',
      date: new Date('2023-06-25'),
      categories: ['newsletter'],
      priority: null,
      attachments: ['森の声46号.pdf'],
      author: '編集部',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '森林整備技術講習会',
      content:
        '森林整備に必要な技術を学ぶ講習会を開催いたします。間伐、枝打ち、下草刈りなどの技術を習得できます。',
      date: new Date('2023-06-20'),
      categories: ['training'],
      priority: null,
      attachments: ['整備技術講習会案内.pdf'],
      author: '技術担当',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '春の森林観察会',
      content:
        '春の森林を観察する会を開催いたします。春の花々、新芽、野鳥など、春ならではの森林の魅力を体験できます。',
      date: new Date('2023-06-15'),
      categories: ['event', 'public'],
      priority: null,
      attachments: ['春の森林観察会案内.pdf'],
      author: '自然観察担当',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '森林ボランティア募集',
      content:
        '森林ボランティアを募集いたします。森林の整備、植樹、観察など、様々な活動に参加できます。経験は問いません。',
      date: new Date('2023-06-10'),
      categories: ['recruitment', 'public'],
      priority: null,
      attachments: ['ボランティア募集.pdf'],
      author: '会員担当',
      status: 'published' as const,
      creatorId: 1 as number
    },
    {
      title: '春の安全講習会',
      content:
        '春の森林ボランティア活動における安全講習会を開催いたします。春特有の注意点を学べます。',
      date: new Date('2023-06-05'),
      categories: ['training'],
      priority: 'confirmation',
      attachments: ['春の安全講習会案内.pdf'],
      author: '安全担当',
      status: 'published' as const,
      creatorId: 1 as number
    }
  ]

  for (const news of newsData) {
    await prisma.news.create({
      data: news
    })
  }

  console.log('お知らせのサンプルデータの挿入が完了しました')
}

runSeed('News', seedNews)
