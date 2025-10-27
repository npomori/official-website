/**
 * メール送信ユーティリティ
 */
import contactSubjects from '@/config/contact-subject.json'
import config from '@/server/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import type { Transporter } from 'nodemailer'
import nodemailer from 'nodemailer'

interface EmailOptions {
  to: string
  subject: string
  text: string
  html?: string
}

interface ContactEmailData {
  name: string
  email: string
  memberType: 'member' | 'non-member'
  subject: string
  message: string
}

/**
 * テンプレートファイルを読み込んで変数を置換
 */
async function renderTemplate(
  templateName: string,
  variables: Record<string, string>
): Promise<string> {
  const templatePath = path.join(process.cwd(), 'src/templates/email', templateName)
  let template = await fs.readFile(templatePath, 'utf-8')

  // 変数を置換
  for (const [key, value] of Object.entries(variables)) {
    template = template.replace(new RegExp(`{{${key}}}`, 'g'), value)
  }

  return template
}

/**
 * メール送信（開発用: コンソール出力）
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  if (config.SMTP_HOST === 'smtp.example.com') {
    // デフォルト値の場合はコンソール出力のみ
    console.log('=== メール送信 ===')
    console.log('To:', options.to)
    console.log('Subject:', options.subject)
    console.log('Text:', options.text)
    if (options.html) {
      console.log('HTML:', options.html)
    }
    console.log('==================')
    return
  }

  // 本番モード: nodemailer を使用して実際にメール送信
  try {
    const transporter: Transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASSWORD
      },
      logger: true
    })

    const info = await transporter.sendMail({
      from: config.MAIL_FROM,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    })
    console.log('メール送信成功:', info.messageId)
  } catch (error) {
    console.error('メール送信エラー:', error)
    throw new Error('メール送信に失敗しました')
  }
}

/**
 * お問い合わせメールを送信
 */
export async function sendContactEmail(data: ContactEmailData): Promise<void> {
  const { name, email, memberType, subject, message } = data

  // 件名の日本語変換（JSONから生成）
  const subjectMap: Record<string, string> = Object.fromEntries(
    contactSubjects.map((item) => [item.value, item.label])
  )
  const subjectText = subjectMap[subject] || subject

  // 会員種別の日本語変換
  const memberTypeText = memberType === 'member' ? '会員' : '非会員'

  // テンプレート変数
  const adminVariables = {
    name,
    email,
    memberType: memberTypeText,
    subject: subjectText,
    message,
    messageHtml: message.replace(/\n/g, '<br>')
  }

  const userVariables = {
    name,
    subject: subjectText,
    message,
    messageHtml: message.replace(/\n/g, '<br>')
  }

  // テンプレートから本文を生成
  const adminText = await renderTemplate('contact-admin.txt', adminVariables)
  const adminHtml = await renderTemplate('contact-admin.html', adminVariables)

  // 管理者にメールを送信
  await sendEmail({
    to: config.CONTACT_EMAIL,
    subject: `【お問い合わせ】${subjectText} - ${name}様より`,
    text: adminText,
    html: adminHtml
  })

  // テンプレートから本文を生成（送信者向け）
  const userText = await renderTemplate('contact-user.txt', userVariables)
  const userHtml = await renderTemplate('contact-user.html', userVariables)

  // 送信者に自動返信メールを送信
  await sendEmail({
    to: email,
    subject: 'お問い合わせを受け付けました',
    text: userText,
    html: userHtml
  })
}
