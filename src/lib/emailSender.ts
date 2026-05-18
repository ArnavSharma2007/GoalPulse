import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEscalationEmail({
  to,
  toName,
  managerEmail,
  managerName,
  triggerEvent,
  daysOverdue,
}: {
  to: string
  toName: string
  managerEmail?: string
  managerName?: string
  triggerEvent: string
  daysOverdue: number
}) {
  const subjects: Record<string, string> = {
    goal_not_submitted: `⚠️ Action Required: Goals not submitted (${daysOverdue} days overdue)`,
    approval_pending: `⏰ Reminder: Goal sheet pending your approval`,
    checkin_missed: `📋 Reminder: Q check-in update required`,
  }

  const bodies: Record<string, string> = {
    goal_not_submitted: `
      <p>Hi ${toName},</p>
      <p>This is a reminder that your goal sheet has <strong>not been submitted</strong> and is now <strong>${daysOverdue} days overdue</strong>.</p>
      <p>Please log in to GoalPulse and submit your goals as soon as possible.</p>
    `,
    approval_pending: `
      <p>Hi ${managerName || toName},</p>
      <p>A team member's goal sheet has been pending your approval for <strong>${daysOverdue} days</strong>.</p>
      <p>Please log in to GoalPulse to review and approve/return the goal sheet.</p>
    `,
    checkin_missed: `
      <p>Hi ${toName},</p>
      <p>Your quarterly check-in update is overdue by <strong>${daysOverdue} days</strong>.</p>
      <p>Please log in to GoalPulse and update your actual achievements for the current quarter.</p>
    `,
  }

  const recipients = [to]
  if (managerEmail && triggerEvent === 'goal_not_submitted') recipients.push(managerEmail)

  await resend.emails.send({
    from: 'GoalPulse <noreply@yourdomain.com>',
    to: recipients,
    subject: subjects[triggerEvent] || 'GoalPulse Reminder',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4f46e5; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">GoalPulse</h1>
        </div>
        <div style="padding: 24px; background: white; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
          ${bodies[triggerEvent] || '<p>Please log in to GoalPulse for updates.</p>'}
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
          <p style="color: #94a3b8; font-size: 12px;">GoalPulse — Performance Management Portal</p>
        </div>
      </div>
    `,
  })
}
