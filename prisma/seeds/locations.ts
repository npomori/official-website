import type { PrismaClient } from '../../src/generated/prisma/client'
import { runSeed } from './_common'

async function seedLocations(prisma: PrismaClient): Promise<void> {
  console.log('活動地のサンプルデータを挿入しています...')

  // 既存の活動地を削除
  await prisma.location.deleteMany()

  // サンプルデータを挿入
  const locationsData = [
    {
      id: 'minoh',
      name: '箕面国有林',
      position: [34.8167, 135.4667],
      type: 'regular',
      activities: '大阪府箕面市の国有林での森林整備活動、植樹活動、自然観察会を行っています。',
      image:
        'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop&q=60',
      address: '大阪府箕面市',
      hasDetail: true,
      activityDetails:
        '森林整備活動では、間伐や下草刈りを通じて健全な森林環境を維持します。\n植樹活動では、地域の気候に適した苗木を植え、未来の森を育てます。\n自然観察会では、専門家の解説を聞きながら、豊かな動植物を観察します。',
      fieldCharacteristics:
        '箕面国有林は大阪の都市部に近い位置にありながら、豊かな自然が残されています。\n標高100～600mの山地で、四季折々の景観が楽しめます。\nシイ、カシなどの常緑広葉樹林が広がり、多様な動植物が生息しています。',
      meetingAddress: '箕面駅前集合(阪急箕面線箕面駅)',
      meetingTime: '毎月第2・4土曜日 9:00集合',
      meetingMapUrl:
        'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3273.8!2d135.4667!3d34.8167!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzTCsDQ5JzAwLjEiTiAxMzXCsDI4JzAwLjEiRQ!5e0!3m2!1sja!2sjp!4v1234567890',
      meetingAdditionalInfo:
        '駅改札を出て左手のロータリーにお集まりください。\n雨天時は駅構内で待機します。',
      access: '阪急箕面線箕面駅から徒歩約20分、または箕面バス停から徒歩約15分',
      facilities: '駐車場、トイレ、休憩所、案内板',
      schedule: '毎月第2・4土曜日 9:00-15:00',
      requirements: '動きやすい服装、長靴、軍手、帽子、水筒、昼食',
      participationFee: '無料',
      contact: '箱面市役所 環境部 06-1234-5678',
      organizer: '田中 太郎',
      startedDate: '2018年4月',
      upcomingDates: [
        '2025年12月14日(土)',
        '2025年12月28日(土)',
        '2026年1月11日(土)',
        '2026年1月25日(土)',
        '2026年2月8日(土)',
        '2026年2月22日(土)',
        '2026年3月14日(土)',
        '2026年3月28日(土)'
      ],
      notes: '・雨天中止の場合は前日17時までに連絡します\n・小学生以下は保護者同伴でお願いします',
      other:
        '【地域連携プログラム】\n近隣農園と協力し、季節の収穫体験を実施（夏：ブルーベリー、秋：サツマイモ、冬：茶の剪定体験）。',
      gallery: [
        {
          name: 'forest-path.jpg',
          filename:
            'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80',
          size: 245760, // 240KB
          caption: '整備された遊歩道'
        },
        {
          name: 'autumn-leaves.jpg',
          filename:
            'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&auto=format&fit=crop&q=80',
          size: 327680, // 320KB
          caption: '秋の紅葉'
        },
        {
          name: 'nature-scene.jpg',
          filename:
            'https://images.unsplash.com/photo-1559028012-481c04fa702d?w=800&auto=format&fit=crop&q=80',
          size: 294912 // 288KB
        }
      ],
      attachments: [
        {
          name: '活動地マップ.pdf',
          filename: 'minoh-map.pdf',
          size: 1258291 // 1.2MB
        },
        {
          name: '持ち物リスト.pdf',
          filename: 'minoh-checklist.pdf',
          size: 262144 // 256KB
        }
      ],
      status: 'published' as const,
      creatorId: 1
    },
    {
      id: 'kongosan',
      name: '金剛山',
      position: [34.4167, 135.6833],
      type: 'regular',
      activities:
        '大阪府と奈良県の県境にある金剛山での登山道整備、森林保全活動、環境調査を行っています。',
      image:
        'https://images.unsplash.com/photo-1440342359743-84fcb8c21f21?w=600&auto=format&fit=crop&q=60',
      address: '大阪府南河内郡千早赤阪村・奈良県御所市',
      hasDetail: true,
      access: '近鉄長野線富田林駅からバス約30分、または車で金剛山ロープウェイ駐車場まで',
      facilities: 'ロープウェイ、駐車場、トイレ、売店、山小屋',
      schedule: '毎月第1・3日曜日 8:00-16:00',
      requirements: '登山靴、リュックサック、雨具、防寒具、水筒、行動食',
      contact: '千早赤阪村役場 産業振興課 0721-72-0081',
      organizer: '山田 花子',
      startedDate: '2015年10月',
      gallery: [
        {
          name: 'mountain-trail.jpg',
          filename:
            'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=800&auto=format&fit=crop&q=80',
          size: 315392, // 308KB
          caption: '金剛山頂上からの景色'
        },
        {
          name: 'forest-work.jpg',
          filename:
            'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&auto=format&fit=crop&q=80',
          size: 286720, // 280KB
          caption: '森林保全作業'
        },
        {
          name: 'mountain-view.jpg',
          filename:
            'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?w=800&auto=format&fit=crop&q=80',
          size: 298752, // 292KB
          caption: '登山道の様子'
        },
        {
          name: 'kongosan-nature.jpg',
          filename:
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&auto=format&fit=crop&q=80',
          size: 303104, // 296KB
          caption: '金剛山の自然環境'
        }
      ],
      status: 'published' as const,
      creatorId: 1
    },
    {
      id: 'kudoyama',
      name: '九度山',
      position: [34.2833, 135.5667],
      type: 'regular',
      activities: '和歌山県九度山町での間伐作業、下草刈り、林道整備を行っています。',
      image:
        'https://images.unsplash.com/photo-1475483768296-6163e08872a1?w=600&auto=format&fit=crop&q=60',
      address: '和歌山県伊都郡九度山町',
      hasDetail: true,
      access: '南海高野線九度山駅から徒歩約10分、または車で九度山町役場まで',
      facilities: '駐車場、トイレ、休憩所、真田庵（史跡）',
      schedule: '毎月第2土曜日 9:00-15:00',
      requirements: '作業服、長靴、軍手、帽子、水筒、昨食',
      contact: '九度山町役場 産業建設課 0736-54-2014',
      organizer: '佐藤 一郎',
      startedDate: '2020年6月',
      gallery: [
        {
          name: 'kudoyama-forest.jpg',
          filename:
            'https://images.unsplash.com/photo-1559028012-481c04fa702d?w=800&auto=format&fit=crop&q=80',
          size: 267264 // 261KB
        },
        {
          name: 'forest-activity.jpg',
          filename:
            'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80',
          size: 301056, // 294KB
          caption: '間伐作業中'
        },
        {
          name: 'mountain-path.jpg',
          filename:
            'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&auto=format&fit=crop&q=80',
          size: 289792 // 283KB
        }
      ],
      status: 'published' as const,
      creatorId: 1
    },
    {
      id: 'nose',
      name: '能勢の森',
      position: [34.9667, 135.4167],
      type: 'regular',
      activities: '大阪府豊能郡能勢町での森づくり活動、植樹祭、自然体験プログラムを行っています。',
      image:
        'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&auto=format&fit=crop&q=60',
      address: '大阪府豊能郡能勢町',
      hasDetail: true,
      access: '能勢電鉄妙見線妙見口駅からバス約15分、または車で能勢町役場まで',
      facilities: '駐車場、トイレ、休憩所、キャンプ場、バーベキュー場',
      schedule: '毎月第3土曜日 9:00-15:00（季節により変動）',
      requirements: '動きやすい服装、長靴、軍手、帽子、水筒、昨食',
      contact: '能勢町役場 産業振興課 072-734-0001',
      organizer: '鈴木 明',
      startedDate: '2019年5月',
      gallery: [
        {
          name: 'nose-forest.jpg',
          filename:
            'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&auto=format&fit=crop&q=80',
          size: 273408, // 267KB
          caption: '植樹祭の様子'
        },
        {
          name: 'nature-experience.jpg',
          filename:
            'https://images.unsplash.com/photo-1593113646773-028c64a8f1b8?w=800&auto=format&fit=crop&q=80',
          size: 308224 // 301KB
        },
        {
          name: 'camp-area.jpg',
          filename:
            'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80',
          size: 295936 // 289KB
        }
      ],
      status: 'published' as const,
      creatorId: 1
    },
    {
      id: 'takatsuki-bijoyama',
      name: '高槻美女山',
      position: [34.85, 135.6167],
      type: 'regular',
      activities: '大阪府高槻市の美女山での森林整備、自然観察、環境教育を行っています。',
      image:
        'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop&q=60',
      address: '大阪府高槻市',
      hasDetail: false,
      status: 'published' as const,
      creatorId: 1
    },
    {
      id: 'yoshikawa',
      name: '吉川の里',
      position: [34.75, 134.9833],
      type: 'regular',
      activities: '兵庫県三木市吉川町での里山保全、農地整備、地域連携活動を行っています。',
      image:
        'https://images.unsplash.com/photo-1440342359743-84fcb8c21f21?w=600&auto=format&fit=crop&q=60',
      address: '兵庫県三木市吉川町',
      hasDetail: false,
      status: 'published' as const,
      creatorId: 1
    },
    {
      id: 'sasayama-maruyama',
      name: '篠山丸山',
      position: [35.0667, 135.2167],
      type: 'regular',
      activities: '兵庫県丹波篠山市の丸山での森林整備、植樹活動、自然観察を行っています。',
      image:
        'https://images.unsplash.com/photo-1475483768296-6163e08872a1?w=600&auto=format&fit=crop&q=60',
      address: '兵庫県丹波篠山市',
      hasDetail: false,
      status: 'published' as const,
      creatorId: 1
    },
    {
      id: 'katsuragi-mitoshi',
      name: '葛城御歳神社',
      position: [34.4667, 135.7333],
      type: 'regular',
      activities:
        '奈良県御所市の葛城御歳神社周辺での神社周辺の整備、文化財保護活動、地域文化継承を行っています。',
      image:
        'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&auto=format&fit=crop&q=60',
      address: '奈良県御所市',
      hasDetail: false,
      status: 'published' as const,
      creatorId: 1
    },
    {
      id: 'muraya',
      name: '村屋神社',
      position: [34.55, 135.7833],
      type: 'regular',
      activities:
        '奈良県磯城郡田原本町の村屋神社での神社境内整備、歴史的環境保全、地域交流活動を行っています。',
      image:
        'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop&q=60',
      address: '奈良県磯城郡田原本町',
      hasDetail: false,
      status: 'published' as const,
      creatorId: 1
    },
    {
      id: 'minamiyamashiro',
      name: '南山城',
      position: [34.7833, 135.85],
      type: 'regular',
      activities: '京都府相楽郡南山城村での森林整備、環境保全、地域貢献活動を行っています。',
      image:
        'https://images.unsplash.com/photo-1440342359743-84fcb8c21f21?w=600&auto=format&fit=crop&q=60',
      address: '京都府相楽郡南山城村',
      hasDetail: false,
      status: 'published' as const,
      creatorId: 1
    },
    {
      id: 'izumi',
      name: 'いずみの森',
      position: [34.4, 135.35],
      type: 'regular',
      activities:
        '大阪府泉南郡熊取町のいずみの森での森づくり活動、自然体験、環境教育を行っています。',
      image:
        'https://images.unsplash.com/photo-1475483768296-6163e08872a1?w=600&auto=format&fit=crop&q=60',
      address: '大阪府泉南郡熊取町',
      hasDetail: false,
      status: 'published' as const,
      creatorId: 1
    },
    {
      id: 'kagu-kobo',
      name: '家具工房の森',
      position: [34.6833, 135.5],
      type: 'regular',
      activities: '家具工房と連携した木材活用、持続可能な森づくり、産業連携を行っています。',
      image:
        'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&auto=format&fit=crop&q=60',
      address: '大阪府',
      hasDetail: false,
      status: 'published' as const,
      creatorId: 1
    },
    {
      id: 'ntt-horigono',
      name: 'ＮＴＴドコモほりごの森活動支援',
      position: [34.85, 135.45],
      type: 'collaboration',
      activities:
        'ＮＴＴドコモとの協働による企業との協働活動、森づくり支援、社会貢献活動を行っています。',
      image:
        'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop&q=60',
      address: '大阪府',
      hasDetail: true,
      access: '近鉄南大阪線河内長野駅からバス約20分、または車でほりごの森駐車場まで',
      facilities: '駐車場、トイレ、休憩所、案内センター、体験施設',
      schedule: '毎月第4土曜日 9:00-15:00（企業イベント時は変更あり）',
      requirements: '動きやすい服装、長靴、軍手、帽子、水筒、昨食',
      contact: 'ＮＴＴドコモ関西支社 CSR推進部 06-1234-5678',
      organizer: '伊藤 健一',
      startedDate: '2016年9月',
      gallery: [
        {
          name: 'ntt-activity.jpg',
          filename:
            'https://images.unsplash.com/photo-1593113646773-028c64a8f1b8?w=800&auto=format&fit=crop&q=80',
          size: 312320, // 305KB
          caption: '企業連携活動の様子'
        },
        {
          name: 'forest-collaboration.jpg',
          filename:
            'https://images.unsplash.com/photo-1559028012-481c04fa702d?w=800&auto=format&fit=crop&q=80',
          size: 285696 // 279KB
        },
        {
          name: 'group-work.jpg',
          filename:
            'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80',
          size: 297984, // 291KB
          caption: 'チーム作業'
        }
      ],
      status: 'published' as const,
      creatorId: 1
    },
    {
      id: 'zurich',
      name: 'チューリッヒ生命植樹指導',
      position: [34.75, 135.55],
      type: 'collaboration',
      activities: 'チューリッヒ生命との連携による植樹指導、環境教育、企業連携を行っています。',
      image:
        'https://images.unsplash.com/photo-1440342359743-84fcb8c21f21?w=600&auto=format&fit=crop&q=60',
      address: '大阪府',
      hasDetail: false,
      status: 'published' as const,
      creatorId: 1
    },
    {
      id: 'mikusayama',
      name: '三草山の防鹿柵設置',
      position: [34.95, 135.25],
      type: 'collaboration',
      activities: '兵庫県三草山での防鹿柵設置、野生動物対策、森林保護を行っています。',
      image:
        'https://images.unsplash.com/photo-1475483768296-6163e08872a1?w=600&auto=format&fit=crop&q=60',
      address: '兵庫県三草山',
      hasDetail: false,
      status: 'published' as const,
      creatorId: 1
    }
  ]

  for (const location of locationsData) {
    await prisma.location.create({
      data: {
        id: location.id,
        name: location.name,
        position: location.position,
        type: location.type,
        activities: location.activities,
        image: location.image,
        address: location.address,
        hasDetail: location.hasDetail,
        activityDetails: location.activityDetails || null,
        fieldCharacteristics: location.fieldCharacteristics || null,
        meetingAddress: location.meetingAddress || null,
        meetingTime: location.meetingTime || null,
        meetingMapUrl: location.meetingMapUrl || null,
        meetingAdditionalInfo: location.meetingAdditionalInfo || null,
        access: location.access,
        facilities: location.facilities,
        schedule: location.schedule,
        requirements: location.requirements,
        participationFee: location.participationFee,
        contact: location.contact,
        organizer: location.organizer,
        startedDate: location.startedDate,
        upcomingDates: location.upcomingDates,
        notes: location.notes,
        other: location.other,
        gallery: location.gallery,
        attachments: location.attachments,
        status: location.status,
        creatorId: location.creatorId
      }
    })
  }

  console.log(`${locationsData.length}件の活動地データを挿入しました`)
}

// メイン実行
void runSeed('locations', seedLocations)
