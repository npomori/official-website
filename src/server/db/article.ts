import type { CreateArticleData, UpdateArticleData } from '@/types/article'
import { PrismaClient, type Prisma } from '@prisma/client'

class ArticleDB {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()
  }

  // 記事一覧を取得（ページネーション対応）
  async getArticlesWithPagination(
    page: number,
    limit: number,
    _isAdmin: boolean = false,
    isLoggedIn: boolean = false,
    category?: string,
    tags?: string[]
  ) {
    const skip = (page - 1) * limit

    // 基本条件を構築
    const where: Record<string, unknown> = {
      status: 'published' // 公開済みの記事のみ
    }

    // カテゴリーフィルター
    if (category) {
      where.category = category
    }

    // タグフィルター
    if (tags && tags.length > 0) {
      Object.assign(where, { tags: { array_contains: tags } })
    }

    // 会員限定コンテンツの制御
    if (!isLoggedIn) {
      where.isMemberOnly = false
    }

    // 記事一覧を取得
    const [articles, totalCount] = await Promise.all([
      this.prisma.article.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit
      }),
      this.prisma.article.count({ where })
    ])

    return { articles, totalCount }
  }

  // 記事詳細を取得
  async getArticleById(id: number, isLoggedIn: boolean = false) {
    const article = await this.prisma.article.findFirst({
      where: {
        id,
        status: 'published',
        ...(isLoggedIn ? {} : { isMemberOnly: false })
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (article) {
      // 閲覧回数を増加
      await this.prisma.article.update({
        where: { id },
        data: { viewCount: { increment: 1 } }
      })
    }

    return article
  }

  // 管理用: ステータスに関わらずIDで取得
  async getArticleByIdAdmin(id: number) {
    return await this.prisma.article.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true }
        }
      }
    })
  }

  // 記事を作成
  async createArticle(data: CreateArticleData) {
    return await this.prisma.article.create({
      data: {
        title: data.title,
        content: data.content,
        featuredImage: data.featuredImage ?? null,
        images: data.images ?? [],
        attachments: (data.attachments ?? null) as unknown as Prisma.InputJsonValue,
        tags: data.tags ?? [],
        category: data.category ?? null,
        status: data.status ?? 'draft',
        publishedAt: data.status === 'published' ? new Date() : null,
        seoDescription: data.seoDescription ?? null,
        seoKeywords: data.seoKeywords ?? null,
        isMemberOnly: data.isMemberOnly ?? false,
        creatorId: data.creatorId
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
  }

  // 記事を更新
  async updateArticle(id: number, data: UpdateArticleData) {
    return await this.prisma.article.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.featuredImage !== undefined && { featuredImage: data.featuredImage }),
        ...(data.images !== undefined && { images: data.images }),
        ...(data.attachments !== undefined && {
          attachments: (data.attachments as unknown as Prisma.InputJsonValue) ?? null
        }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.seoDescription !== undefined && { seoDescription: data.seoDescription }),
        ...(data.seoKeywords !== undefined && { seoKeywords: data.seoKeywords }),
        ...(data.isMemberOnly !== undefined && { isMemberOnly: data.isMemberOnly }),
        ...(data.status !== undefined && {
          publishedAt: data.status === 'published' ? new Date() : null
        })
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
  }

  // 記事を削除
  async deleteArticle(id: number) {
    return await this.prisma.article.delete({
      where: { id }
    })
  }

  // カテゴリー一覧を取得
  async getCategories() {
    const categories = await this.prisma.article.findMany({
      where: {
        status: 'published',
        category: { not: null }
      },
      select: {
        category: true
      },
      distinct: ['category']
    })

    return categories.map((c) => c.category).filter((c): c is string => c !== null)
  }

  // タグ一覧を取得
  async getTags() {
    const articles = await this.prisma.article.findMany({
      where: {
        status: 'published'
        // Prisma JSON not null filter: use { not: Prisma.JsonNull }
        // but to keep it simple, fetch all and filter below
      },
      select: {
        tags: true
      }
    })

    const allTags = articles
      .flatMap((article) => article.tags || [])
      .filter((tag): tag is string => typeof tag === 'string')

    return [...new Set(allTags)]
  }

  // 関連記事を取得
  async getRelatedArticles(
    currentArticleId: number,
    category?: string,
    tags?: string[],
    limit: number = 3
  ) {
    const where: Record<string, unknown> = {
      id: { not: currentArticleId },
      status: 'published'
    }

    if (category) {
      where.category = category
    }

    if (tags && tags.length > 0) {
      Object.assign(where, { OR: [{ category: category }, { tags: { array_contains: tags } }] })
    }

    return await this.prisma.article.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: limit
    })
  }

  // 人気記事を取得
  async getPopularArticles(limit: number = 5) {
    return await this.prisma.article.findMany({
      where: {
        status: 'published'
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [{ viewCount: 'desc' }, { publishedAt: 'desc' }],
      take: limit
    })
  }

  // 最新記事を取得
  async getLatestArticles(limit: number = 5) {
    return await this.prisma.article.findMany({
      where: {
        status: 'published'
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: limit
    })
  }
}

export default new ArticleDB()
