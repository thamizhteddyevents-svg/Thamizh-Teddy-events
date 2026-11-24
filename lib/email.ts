
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    throw new Error('Email configuration is missing')
  }

  return await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  })
}
