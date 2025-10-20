/**
 * メール送信ユーティリティ
 */
import contactSubjects from '@/config/contact-subject.json'
import config from '@/server/config'
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
 * メール送信（開発用: コンソール出力）
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  // console.log('=== メール送信 ===')
  // console.log('To:', options.to)
  // console.log('Subject:', options.subject)
  // console.log('Text:', options.text)
  // if (options.html) {
  //   console.log('HTML:', options.html)
  // }
  // console.log('==================')

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

  // 管理者宛のメール本文
  const adminText = `
新しいお問い合わせがありました。

【お名前】
${name}

【メールアドレス】
${email}

【会員種別】
${memberTypeText}

【件名】
${subjectText}

【お問い合わせ内容】
${message}

---
このメールは公式サイトのお問い合わせフォームから送信されました。
`

  const adminHtml = `
<h2>新しいお問い合わせがありました</h2>

<p><strong>【お名前】</strong><br>
${name}</p>

<p><strong>【メールアドレス】</strong><br>
<a href="mailto:${email}">${email}</a></p>

<p><strong>【会員種別】</strong><br>
${memberTypeText}</p>

<p><strong>【件名】</strong><br>
${subjectText}</p>

<p><strong>【お問い合わせ内容】</strong><br>
${message.replace(/\n/g, '<br>')}</p>

<hr>
<p><small>このメールは公式サイトのお問い合わせフォームから送信されました。</small></p>
`

  // 管理者にメールを送信
  await sendEmail({
    to: config.CONTACT_EMAIL,
    subject: `【お問い合わせ】${subjectText} - ${name}様より`,
    text: adminText,
    html: adminHtml
  })

  // 送信者への自動返信（オプション）
  const userText = `
${name} 様

この度は、お問い合わせいただきありがとうございます。
以下の内容でお問い合わせを受け付けました。

【件名】
${subjectText}

【お問い合わせ内容】
${message}

内容を確認の上、担当者より折り返しご連絡させていただきます。
今しばらくお待ちくださいますようお願い申し上げます。

---
このメールは自動送信されています。
返信いただいても対応できませんのでご了承ください。
`

  const userHtml = `
<p>${name} 様</p>

<p>この度は、お問い合わせいただきありがとうございます。<br>
以下の内容でお問い合わせを受け付けました。</p>

<p><strong>【件名】</strong><br>
${subjectText}</p>

<p><strong>【お問い合わせ内容】</strong><br>
${message.replace(/\n/g, '<br>')}</p>

<p>内容を確認の上、担当者より折り返しご連絡させていただきます。<br>
今しばらくお待ちくださいますようお願い申し上げます。</p>

<hr>
<p><small>このメールは自動送信されています。<br>
返信いただいても対応できませんのでご了承ください。</small></p>
`

  // 送信者に自動返信メールを送信
  await sendEmail({
    to: email,
    subject: 'お問い合わせを受け付けました',
    text: userText,
    html: userHtml
  })
}
