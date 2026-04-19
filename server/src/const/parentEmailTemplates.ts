export const ParentEmailTemplates = {
  feeReminder: (studentName: string, amount: string, dueHint: string) => ({
    subject: `Fee reminder — ${studentName}`,
    html: `
<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;padding:24px;background:#f6f7fb;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;box-shadow:0 4px 20px rgba(0,0,0,.06);">
    <h2 style="margin:0 0 8px;">Fee reminder</h2>
    <p style="color:#555;">This is a friendly reminder regarding <strong>${studentName}</strong>.</p>
    <p style="font-size:18px;font-weight:600;">Amount: ${amount}</p>
    <p style="color:#666;">${dueHint}</p>
    <p style="color:#999;font-size:12px;margin-top:24px;">Sent by Attendly on behalf of your tuition center.</p>
  </div>
</body></html>`,
    text: `Fee reminder for ${studentName}. Amount ${amount}. ${dueHint}`,
  }),
  attendanceAlert: (studentName: string, status: string, dateStr: string) => ({
    subject: `Attendance update — ${studentName}`,
    html: `
<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;padding:24px;background:#f6f7fb;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;">
    <h2 style="margin:0 0 8px;">Attendance</h2>
    <p><strong>${studentName}</strong> was marked <strong>${status}</strong> on ${dateStr}.</p>
    <p style="color:#999;font-size:12px;margin-top:24px;">Attendly · your tuition center</p>
  </div>
</body></html>`,
    text: `${studentName} — ${status} on ${dateStr}`,
  }),
};
