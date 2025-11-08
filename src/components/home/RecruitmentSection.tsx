import React from 'react'

interface RecruitmentEvent {
  slug: string
  data: {
    title: string
    description?: string
    date?: Date
    tags?: string[]
  }
}

interface RecruitmentSectionProps {
  events: RecruitmentEvent[]
}

export default function RecruitmentSection({ events }: RecruitmentSectionProps) {
  return (
    <section className="mb-16">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-3xl font-bold">参加者募集中</h2>
        <a href="/articles" className="text-primary-600 font-semibold">
          すべてのイベントを見る <i className="fas fa-arrow-right ml-1"></i>
        </a>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {events.map((event) => (
          <article key={event.slug} className="overflow-hidden rounded-lg bg-white shadow-lg">
            <div className="bg-primary-600 p-4 text-white">
              <div className="mb-2 flex items-center text-sm">
                <i className="fas fa-calendar mr-2" />
                {event.data.date
                  ? new Date(event.data.date).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : '日付未定'}
              </div>
              <h3 className="text-xl font-bold">{event.data.title}</h3>
            </div>
            <div className="p-4">
              <p className="mb-4 line-clamp-3 text-gray-600">{event.data.description}</p>
              <div className="mb-4 flex flex-wrap gap-2">
                {event.data.tags?.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="bg-primary-100 text-primary-800 rounded-full px-3 py-1 text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <a
                href={`/articles/${event.slug}`}
                className="text-primary-600 inline-flex items-center font-semibold"
              >
                詳細を見る
                <i className="fas fa-arrow-right ml-2" />
              </a>
            </div>
          </article>
        ))}
        {events.length === 0 && (
          <div className="col-span-2 rounded-lg bg-gray-50 p-8 text-center">
            <p className="text-gray-600">現在、募集中のイベントはありません。</p>
          </div>
        )}
      </div>
    </section>
  )
}
