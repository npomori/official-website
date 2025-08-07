import type { APIRoute } from 'astro'
import INITIAL_HOLIDAY from '../../data/holiday.json'

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url)
    const start = url.searchParams.get('start')
    const end = url.searchParams.get('end')

    return new Response(JSON.stringify(INITIAL_HOLIDAY), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '予期せぬエラーが発生しました'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}
