import useSWR from 'swr'

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('データの取得に失敗しました')
  }
  const result = await response.json()

  // 新しいAPIレスポンス形式に対応
  if (result.success === false) {
    throw new Error(result.message || 'データの取得に失敗しました')
  }

  // successがtrueの場合はdataを返す、そうでなければresultをそのまま返す（後方互換性のため）
  return result.success === true ? result.data : result
}

export { fetcher }
export default useSWR
