import { BaseApiFetch } from './base'

/**
 * お問い合わせフォームのデータ型
 */
export interface ContactEmailData {
  name: string
  email: string
  memberType: 'member' | 'non-member'
  subject: string
  message: string
  privacy: boolean
}

/**
 * 入会申し込みフォームのデータ型
 */
export interface JoinEmailData {
  memberType: 'regular' | 'support'
  name: string
  furigana: string
  email: string
  tel: string
  address: string
  birthDate: string
  occupation?: string
  experience?: string
  motivation: string
  privacy: boolean
}

/**
 * メール送信レスポンス型
 */
interface EmailResponse {
  message: string
}

/**
 * メール送信関連のFetchクラス
 * お問い合わせと入会申し込みのメール送信機能を提供
 */
class EmailFetch extends BaseApiFetch {
  /**
   * お問い合わせメールを送信
   * @param data - お問い合わせフォームデータ
   * @returns APIレスポンス
   */
  async sendContact(data: ContactEmailData) {
    return this.requestWithJson<EmailResponse>('/api/email/contact', data, 'POST')
  }

  /**
   * 入会申し込みメールを送信
   * @param data - 入会申し込みフォームデータ
   * @returns APIレスポンス
   */
  async sendJoinApplication(data: JoinEmailData) {
    return this.requestWithJson<EmailResponse>('/api/email/join', data, 'POST')
  }
}

export default new EmailFetch()
