import { Resend } from 'resend'

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

  // Instantiate on demand so importing this module never fails at build time.
  const resend = new Resend(process.env.RESEND_API_KEY)

  return await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  })
}
