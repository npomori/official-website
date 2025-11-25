import type { PrismaClient } from '../../src/generated/prisma/client'
import { runSeed } from './_common'

async function seedRecords(prisma: PrismaClient): Promise<void> {
  console.log('森林ボランティア活動のRecordモデルサンプルデータを挿入しています...')

  // 既存のレコードを削除
  await prisma.record.deleteMany()

  // まず、ユーザーが存在するかチェックし、存在しない場合は作成
  const existingUser = await prisma.user.findFirst({
    where: {
      email: 'admin@example.com'
    }
  })

  let userId: number
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

  // Recordモデルのサンプルデータを作成（森林ボランティア活動用）
  const sampleRecords = []

  // 1月のデータ（15件）- 冬の森林整備活動
  for (let i = 1; i <= 15; i++) {
    sampleRecords.push({
      location: `奥多摩町 森林公園${String.fromCharCode(64 + (i % 3) + 1)}エリア`,
      datetime: `2024年1月${String(i).padStart(2, '0')}日（${['月', '火', '水', '木', '金', '土', '日'][(i - 1) % 7]}）9:00～15:00`,
      eventDate: new Date(`2024-01-${String(i).padStart(2, '0')}`),
      weather: [
        '晴れ、気温5℃、湿度30%',
        '曇り、気温3℃、湿度40%',
        '雪、気温-2℃、湿度60%',
        '晴れ、気温8℃、湿度35%'
      ][i % 4],
      participants: `総勢${40 + (i % 20)}名（一般参加者${30 + (i % 15)}名、スタッフ${10 + (i % 5)}名）`,
      reporter: `田中 正義（活動リーダー${i}）`,
      content: `第${i}回目の冬期森林整備活動を実施。落ち葉の除去、倒木の処理、散策路の整備、野生動物の巣箱設置を行いました。参加者への森林生態系の説明も実施。`,
      nearMiss:
        i % 3 === 0
          ? `参加者の1名が斜面で滑りそうになりましたが、事前の安全指導により未然に防げました。次回はより安全な場所での活動を検討します。`
          : '特にありませんでした。',
      equipment: i % 2 === 0 ? 'チェーンソー、手鋸、軍手' : '手鋸、軍手、巣箱',
      remarks: `冬期の森林整備は予定通り完了。野生動物の保護活動も好評でした。`,
      categories: ['maintenance', 'wildlife'],
      images: [],
      status: 'published' as const,
      creatorId: userId
    })
  }

  // 2月のデータ（12件）- 早春の植樹準備
  for (let i = 1; i <= 12; i++) {
    sampleRecords.push({
      location: `京都府 嵐山竹林${String.fromCharCode(65 + (i % 4))}エリア`,
      datetime: `2024年2月${String(i).padStart(2, '0')}日（${['月', '火', '水', '木', '金', '土', '日'][(i - 1) % 7]}）8:00～14:00`,
      eventDate: new Date(`2024-02-${String(i).padStart(2, '0')}`),
      weather: [
        '晴れ、気温12℃、湿度40%',
        '曇り、気温10℃、湿度45%',
        '雨、気温8℃、湿度70%',
        '雪、気温2℃、湿度50%',
        '霧、気温6℃、湿度80%'
      ][i % 5],
      participants: `総勢${35 + (i % 15)}名（一般参加者${25 + (i % 10)}名、スタッフ${10 + (i % 5)}名）`,
      reporter: `山田 健一（竹林整備リーダー${i}）`,
      content: `第${i}回目の竹林整備作業を実施。古い竹の除去、新芽の保護、散策路の整備、植樹用の穴掘り作業を完了しました。参加者への竹の生態についての説明も実施。`,
      nearMiss:
        i % 4 === 0
          ? `竹の切り倒し作業中、風向きにより竹が予想と異なる方向に倒れましたが、事前の安全確保により事故を防げました。`
          : '特にありませんでした。',
      equipment: i % 3 === 0 ? 'ノコギリ、竹切り用のこぎり、手袋' : 'スコップ、じょうろ、苗木',
      remarks: `春の竹林は美しく、参加者から好評でした。次回の植樹活動の準備も完了しました。`,
      categories: ['cleaning', 'planting'],
      images: [],
      status: 'published' as const,
      creatorId: userId
    })
  }

  // 3月のデータ（10件）- 春の植樹活動
  for (let i = 1; i <= 10; i++) {
    sampleRecords.push({
      location: `和歌山県 白浜海岸${String.fromCharCode(65 + (i % 3))}エリア`,
      datetime: `2024年3月${String(i).padStart(2, '0')}日（${['月', '火', '水', '木', '金', '土', '日'][(i - 1) % 7]}）9:00～15:00`,
      eventDate: new Date(`2024-03-${String(i).padStart(2, '0')}`),
      weather: ['晴れ、気温18℃、湿度40%', '曇り、気温15℃、湿度50%', '雨、気温12℃、湿度75%'][i % 3],
      participants: `総勢${45 + (i % 20)}名（一般参加者${35 + (i % 15)}名、スタッフ${10 + (i % 5)}名）`,
      reporter: `山本 亮介（植樹活動リーダー${i}）`,
      content: `第${i}回目の春期植樹活動を実施。コナラ、クヌギの苗木${100 + i * 10}本を植樹。植樹後の水やり作業、参加者への森林保全の重要性について説明。記念撮影と交流会も実施。`,
      nearMiss:
        i % 5 === 0
          ? `参加者の1名が苗木を運搬中に転びそうになりましたが、周囲の参加者が適切にサポートし、事故を防げました。`
          : '特にありませんでした。',
      equipment: 'スコップ、じょうろ、苗木、記念プレート',
      remarks: `植樹活動は予定通り完了。参加者の満足度が高く、環境保全への意識向上につながりました。`,
      categories: ['planting', 'education'],
      images: [],
      status: 'published' as const,
      creatorId: userId
    })
  }

  // 4月のデータ（8件）- 春の森林調査
  for (let i = 1; i <= 8; i++) {
    sampleRecords.push({
      location: `長野県 軽井沢森林${String.fromCharCode(65 + (i % 2))}エリア`,
      datetime: `2024年4月${String(i).padStart(2, '0')}日（${['月', '火', '水', '木', '金', '土', '日'][(i - 1) % 7]}）10:00～16:00`,
      eventDate: new Date(`2024-04-${String(i).padStart(2, '0')}`),
      weather: [
        '晴れ、気温20℃、湿度35%',
        '曇り、気温18℃、湿度45%',
        '雨、気温15℃、湿度80%',
        '晴れ、気温22℃、湿度30%'
      ][i % 4],
      participants: `総勢${30 + (i % 15)}名（一般参加者${20 + (i % 10)}名、スタッフ${10 + (i % 5)}名）`,
      reporter: `佐藤 美咲（森林調査リーダー${i}）`,
      content: `第${i}回目の森林調査活動を実施。樹木の健康状態確認、野生動物の痕跡調査、土壌サンプリング、植生調査を行いました。参加者への森林生態系の説明も実施。`,
      nearMiss:
        i % 3 === 0
          ? `調査中に蜂の巣を発見しましたが、事前の安全指導により適切に回避できました。`
          : '特にありませんでした。',
      equipment: '調査器具、カメラ、サンプリング袋、記録用タブレット',
      remarks: `森林調査により、地域の生態系の現状を把握できました。今後の保全活動の参考資料として活用します。`,
      categories: ['survey', 'observation'],
      images: [],
      status: 'published' as const,
      creatorId: userId
    })
  }

  // 5月のデータ（5件）- 初夏の清掃活動
  for (let i = 1; i <= 5; i++) {
    sampleRecords.push({
      location: `神奈川県 箱根森林公園`,
      datetime: `2024年5月${String(i).padStart(2, '0')}日（${['月', '火', '水', '木', '金', '土', '日'][(i - 1) % 7]}）9:00～12:00`,
      eventDate: new Date(`2024-05-${String(i).padStart(2, '0')}`),
      weather: [
        '晴れ、気温25℃、湿度45%',
        '曇り、気温22℃、湿度55%',
        '雨、気温20℃、湿度85%',
        '晴れ、気温28℃、湿度40%',
        '曇り、気温24℃、湿度50%'
      ][i - 1],
      participants: `総勢${50 + (i % 20)}名（一般参加者${40 + (i % 15)}名、スタッフ${10 + (i % 5)}名）`,
      reporter: `高橋 恵子（清掃活動リーダー${i}）`,
      content: `第${i}回目の森林清掃活動を実施。散策路沿いのゴミ拾い、不法投棄物の撤去、環境保全の啓発活動も実施。参加者への環境教育も行いました。`,
      nearMiss:
        i % 2 === 0
          ? `清掃中にガラス片で手を切りそうになりましたが、手袋着用により防げました。`
          : '特にありませんでした。',
      equipment: 'ゴミ袋、軍手、分別シート、トング',
      remarks: `天気が良く、参加者の満足度が高かったです。環境保全への意識向上につながりました。`,
      categories: ['cleaning', 'education'],
      images: [],
      status: 'published' as const,
      creatorId: userId
    })
  }

  for (const record of sampleRecords) {
    await prisma.record.create({
      data: record
    })
  }

  console.log('森林ボランティア活動のRecordモデルサンプルデータの挿入が完了しました')
}

runSeed('Records', seedRecords)
