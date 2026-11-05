import { Resend } from 'resend';

export interface SendInvoiceEmailOptions {
  recipientEmail: string | string[];
  ccEmails?: string[];
  bccEmails?: string[];
  recipientName: string;
  senderName: string;
  companyName: string;
  invoiceNumber: string;
  totalFormatted: string;
  dueDateFormatted: string;
  passcode: string;
  viewUrl: string;
  customSubject?: string;
  customMessage?: string;
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function formatCustomMessageHtml(rawMessage: string): string {
  const escaped = escapeHtml(rawMessage.trim());
  return escaped
    .split(/\n{2,}/)
    .map((para) => `<p style="margin: 0 0 14px 0;">${para.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export async function sendInvoiceEmail(options: SendInvoiceEmailOptions) {
  const {
    recipientEmail,
    ccEmails = [],
    bccEmails = [],
    recipientName,
    senderName,
    companyName,
    invoiceNumber,
    totalFormatted,
    dueDateFormatted,
    passcode,
    viewUrl,
    customSubject,
    customMessage,
  } = options;

  const toList = Array.isArray(recipientEmail)
    ? recipientEmail.map((e) => e.trim()).filter(Boolean)
    : [recipientEmail.trim()].filter(Boolean);
  const ccList = ccEmails.map((e) => e.trim()).filter(Boolean);
  const bccList = bccEmails.map((e) => e.trim()).filter(Boolean);

  const subjectLine =
    customSubject?.trim() || `Invoice ${invoiceNumber} from ${companyName || senderName}`;

  const greetingHtml = customMessage?.trim()
    ? formatCustomMessageHtml(customMessage)
    : `Dear ${escapeHtml(recipientName || 'Valued Client')},<br><br>An invoice has been issued by <strong>${escapeHtml(companyName || senderName)}</strong>.`;

  const resendApiKey = process.env.RESEND_API_KEY;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(subjectLine)}</title>
  <style>
    body {
      background-color: #111215;
      font-family: 'Georgia', serif;
      margin: 0;
      padding: 40px 15px;
      color: #18191B;
    }
    .wrapper {
      max-width: 580px;
      margin: 0 auto;
      background-color: #FAF8F5;
      border: 1px solid #E6E1D9;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      border-radius: 2px;
      overflow: hidden;
    }
    .header {
      padding: 36px 36px 24px;
      border-bottom: 2px solid #18191B;
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      letter-spacing: -0.02em;
      text-transform: uppercase;
      font-weight: 700;
      color: #18191B;
    }
    .content {
      padding: 36px;
    }
    .greeting {
      font-size: 15px;
      line-height: 1.65;
      color: #18191B;
      margin-bottom: 24px;
    }
    .metadata-table {
      width: 100%;
      border-collapse: collapse;
      margin: 24px 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
    }
    .metadata-table td {
      padding: 10px 0;
      border-bottom: 1px solid #E6E1D9;
    }
    .metadata-table td.label {
      color: #5C5E62;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.05em;
    }
    .metadata-table td.val {
      text-align: right;
      font-weight: 600;
      color: #18191B;
      font-family: 'Courier New', Courier, monospace;
      font-size: 15px;
    }
    .pin-box {
      background-color: #ECE6DC;
      border: 1px dashed #5C5E62;
      padding: 20px;
      text-align: center;
      margin: 28px 0;
      border-radius: 2px;
    }
    .pin-label {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #5C5E62;
      margin-bottom: 8px;
    }
    .pin-code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 32px;
      letter-spacing: 0.25em;
      font-weight: bold;
      color: #C84630;
    }
    .cta-container {
      text-align: center;
      margin: 32px 0 20px;
    }
    .button {
      background-color: #18191B;
      color: #FAF8F5 !important;
      text-decoration: none;
      padding: 14px 32px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      display: inline-block;
      border-radius: 2px;
    }
    .footer {
      padding: 20px 36px;
      background-color: #F3EFEA;
      border-top: 1px solid #E6E1D9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 12px;
      color: #A1A3A8;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>${escapeHtml(companyName || senderName || "The Architect's Ledger")}</h1>
    </div>
    <div class="content">
      <div class="greeting">
        ${greetingHtml}
      </div>

      <table class="metadata-table">
        <tr>
          <td class="label">Invoice Reference</td>
          <td class="val">${escapeHtml(invoiceNumber)}</td>
        </tr>
        <tr>
          <td class="label">Total Amount Due</td>
          <td class="val">${escapeHtml(totalFormatted)}</td>
        </tr>
        <tr>
          <td class="label">Payment Due Date</td>
          <td class="val">${escapeHtml(dueDateFormatted)}</td>
        </tr>
      </table>

      <div class="pin-box">
        <div class="pin-label">Secure Access Verification Code (PIN)</div>
        <div class="pin-code">${escapeHtml(passcode)}</div>
      </div>

      <div class="cta-container">
        <a href="${viewUrl}" class="button" target="_blank">Access Verified Document &rarr;</a>
      </div>
    </div>
    <div class="footer">
      This is a secure archival document dispatch issued via The Architect's Ledger.<br>
      Please do not share your verification PIN with unauthorized third parties.
    </div>
  </div>
</body>
</html>
  `;

  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      const data = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'Ledger <invoices@architectsledger.com>',
        to: toList,
        ...(ccList.length > 0 ? { cc: ccList } : {}),
        ...(bccList.length > 0 ? { bcc: bccList } : {}),
        subject: subjectLine,
        html: htmlContent,
      });
      return { success: true, data, simulated: false };
    } catch (error) {
      console.error('Failed to send email via Resend:', error);
      return { success: false, error, simulated: false };
    }
  }

  // Fallback simulator for development without Resend API key
  console.log(`\n======================================================`);
  console.log(`[SIMULATED TRANSACTIONAL EMAIL DISPATCH]`);
  console.log(`To: ${toList.join(', ')} (${recipientName})`);
  if (ccList.length > 0) console.log(`CC: ${ccList.join(', ')}`);
  if (bccList.length > 0) console.log(`BCC: ${bccList.join(', ')}`);
  console.log(`Subject: ${subjectLine}`);
  console.log(`Invoice: ${invoiceNumber} | Total: ${totalFormatted}`);
  console.log(`Verification PIN: ${passcode}`);
  console.log(`Access Portal URL: ${viewUrl}`);
  console.log(`======================================================\n`);

  return { success: true, simulated: true, passcode, viewUrl };
}
