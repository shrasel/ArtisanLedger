import { Resend } from 'resend';
import type { InvoiceItem, Organization, Client } from '@/db/schema';
import { formatCentsToCurrency, formatBasisPointsToPercent } from './utils';

export interface SendInvoiceEmailOptions {
  recipientEmail: string | string[];
  ccEmails?: string[];
  bccEmails?: string[];
  recipientName: string;
  senderName: string;
  companyName: string;
  invoiceNumber: string;
  issueDateFormatted?: string;
  totalFormatted: string;
  dueDateFormatted: string;
  currency?: string;
  subtotalCents?: number;
  discountCents?: number;
  taxRateBasisPoints?: number;
  taxAmountCents?: number;
  totalCents?: number;
  notes?: string | null;
  termsConditions?: string | null;
  items?: InvoiceItem[];
  organization?: Organization;
  client?: Client;
  pdfBuffer?: Buffer;
  passcode: string;
  viewUrl: string;
  customSubject?: string;
  customMessage?: string;
  resendApiKeyOverride?: string | null;
  emailFromOverride?: string | null;
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
    issueDateFormatted,
    totalFormatted,
    dueDateFormatted,
    currency = 'USD',
    subtotalCents = 0,
    discountCents = 0,
    taxRateBasisPoints = 0,
    taxAmountCents = 0,
    notes,
    termsConditions,
    items = [],
    organization,
    client,
    pdfBuffer,
    passcode,
    viewUrl,
    customSubject,
    customMessage,
    resendApiKeyOverride,
    emailFromOverride,
  } = options;

  const toList = Array.isArray(recipientEmail)
    ? recipientEmail.map((e) => e.trim()).filter(Boolean)
    : [recipientEmail.trim()].filter(Boolean);
  const ccList = ccEmails.map((e) => e.trim()).filter(Boolean);
  const bccList = bccEmails.map((e) => e.trim()).filter(Boolean);

  // Build From / Billed to HTML block if organization & client are provided
  const fromName =
    organization?.entityType === 'INDIVIDUAL'
      ? organization.principalName || organization.companyName || senderName || companyName
      : organization?.companyName || organization?.principalName || companyName || senderName;

  const subjectLine =
    customSubject?.trim() ||
    `Invoice # ${invoiceNumber} — ${totalFormatted} from ${fromName || senderName || companyName}`;

  const greetingHtml = customMessage?.trim()
    ? formatCustomMessageHtml(customMessage)
    : `Dear ${escapeHtml(
        recipientName || 'Valued Client'
      )},<br><br>Please find attached Invoice <strong>${escapeHtml(
        invoiceNumber
      )}</strong> for <strong>${escapeHtml(totalFormatted)}</strong>, due on <strong>${escapeHtml(
        dueDateFormatted
      )}</strong>. You can also view and download the invoice as a PDF through the secure portal using the link and six-digit verification PIN below.`;

  const resendApiKey = resendApiKeyOverride?.trim() || process.env.RESEND_API_KEY;
  const rawSenderFrom =
    emailFromOverride?.trim() ||
    process.env.EMAIL_FROM ||
    `${fromName || "The Architect's Ledger"} <onboarding@resend.dev>`;

  // Public webmail domains (gmail.com, yahoo.com, outlook.com, etc.) cannot be DNS-verified in Resend.
  // If user configured "Name <user@gmail.com>" or "user@gmail.com", automatically use "<onboarding@resend.dev>"
  // with their display name and set replyTo to their personal email so delivery always succeeds.
  let senderFrom = rawSenderFrom;
  let replyToEmail: string | undefined = organization?.email || undefined;

  const angleMatch = rawSenderFrom.match(/^([^<]*)<([^>]+)>$/);
  const extractedName = (angleMatch ? angleMatch[1].trim() : fromName || "The Architect's Ledger").replace(/["<>]/g, '');
  const extractedEmail = (angleMatch ? angleMatch[2].trim() : rawSenderFrom.trim()).toLowerCase();

  if (/@(gmail|googlemail|yahoo|outlook|hotmail|icloud|me|aol|protonmail|proton|live|msn)\./i.test(extractedEmail)) {
    replyToEmail = extractedEmail;
    senderFrom = `${extractedName || fromName || "The Architect's Ledger"} <onboarding@resend.dev>`;
  } else if (!rawSenderFrom.includes('@')) {
    senderFrom = `${rawSenderFrom} <onboarding@resend.dev>`;
  }

  const partyBlockHtml =
    organization && client
      ? `
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; border-top: 1px solid #E6E1D9; border-bottom: 1px solid #E6E1D9; padding: 14px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px;">
        <tr>
          <td style="width: 50%; vertical-align: top; padding: 14px 12px 14px 0;">
            <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #5C5E62; font-weight: 700; margin-bottom: 4px;">From</div>
            <div style="font-family: Georgia, serif; font-size: 14px; font-weight: 700; color: #18191B; margin-bottom: 2px;">${escapeHtml(fromName || '')}</div>
            ${organization.addressLine ? `<div style="color: #5C5E62;">${escapeHtml(organization.addressLine)}</div>` : ''}
            ${
              [organization.city, organization.state, organization.postalCode].filter(Boolean).length > 0
                ? `<div style="color: #5C5E62;">${escapeHtml(
                    [organization.city, organization.state, organization.postalCode]
                      .filter(Boolean)
                      .join(', ')
                  )}</div>`
                : ''
            }
            ${organization.email ? `<div style="color: #5C5E62;">${escapeHtml(organization.email)}</div>` : ''}
            ${organization.phone ? `<div style="color: #5C5E62;">${escapeHtml(organization.phone)}</div>` : ''}
          </td>
          <td style="width: 50%; vertical-align: top; padding: 14px 0 14px 12px;">
            <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #5C5E62; font-weight: 700; margin-bottom: 4px;">Billed to</div>
            <div style="font-family: Georgia, serif; font-size: 14px; font-weight: 700; color: #18191B; margin-bottom: 2px;">${escapeHtml(client.companyName || client.name)}</div>
            ${client.companyName ? `<div style="color: #5C5E62;">Attn: ${escapeHtml(client.name)}</div>` : ''}
            ${client.address ? `<div style="color: #5C5E62;">${escapeHtml(client.address)}</div>` : ''}
            ${client.email ? `<div style="color: #5C5E62;">${escapeHtml(client.email)}</div>` : ''}
          </td>
        </tr>
      </table>`
      : '';

  // Build Line Items Table HTML if items are provided
  const lineItemsHtml =
    items.length > 0
      ? `
      <div style="margin: 24px 0;">
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #5C5E62; font-weight: 700; margin-bottom: 8px;">Line Items &amp; Deliverables</div>
        <table style="width: 100%; border-collapse: collapse; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px;">
          <thead>
            <tr style="border-bottom: 1.5px solid #18191B;">
              <th style="text-align: left; padding: 8px 4px; font-size: 10px; text-transform: uppercase; color: #5C5E62;">Description</th>
              <th style="text-align: center; padding: 8px 4px; font-size: 10px; text-transform: uppercase; color: #5C5E62;">Qty</th>
              <th style="text-align: right; padding: 8px 4px; font-size: 10px; text-transform: uppercase; color: #5C5E62;">Rate</th>
              <th style="text-align: right; padding: 8px 4px; font-size: 10px; text-transform: uppercase; color: #5C5E62;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (item) => `
              <tr style="border-bottom: 1px solid #E6E1D9;">
                <td style="padding: 9px 4px; color: #18191B;">${escapeHtml(item.description || '—')}</td>
                <td style="padding: 9px 4px; text-align: center; font-family: 'Courier New', Courier, monospace; color: #18191B;">${item.quantity}</td>
                <td style="padding: 9px 4px; text-align: right; font-family: 'Courier New', Courier, monospace; color: #18191B;">${escapeHtml(
                  formatCentsToCurrency(item.unitPriceCents, currency)
                )}</td>
                <td style="padding: 9px 4px; text-align: right; font-family: 'Courier New', Courier, monospace; font-weight: 700; color: #18191B;">${escapeHtml(
                  formatCentsToCurrency(item.totalCents, currency)
                )}</td>
              </tr>`
              )
              .join('')}
          </tbody>
        </table>

        <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px;">
          <tr>
            <td style="width: 50%;"></td>
            <td style="width: 25%; padding: 4px 0; color: #5C5E62; text-transform: uppercase; font-size: 11px;">Subtotal</td>
            <td style="width: 25%; padding: 4px 0; text-align: right; font-family: 'Courier New', Courier, monospace; color: #18191B;">${escapeHtml(
              formatCentsToCurrency(subtotalCents, currency)
            )}</td>
          </tr>
          ${
            discountCents > 0
              ? `<tr>
                  <td></td>
                  <td style="padding: 4px 0; color: #5C5E62; text-transform: uppercase; font-size: 11px;">Discount</td>
                  <td style="padding: 4px 0; text-align: right; font-family: 'Courier New', Courier, monospace; color: #C84630;">-${escapeHtml(
                    formatCentsToCurrency(discountCents, currency)
                  )}</td>
                </tr>`
              : ''
          }
          ${
            taxRateBasisPoints > 0
              ? `<tr>
                  <td></td>
                  <td style="padding: 4px 0; color: #5C5E62; text-transform: uppercase; font-size: 11px;">Tax (${escapeHtml(
                    formatBasisPointsToPercent(taxRateBasisPoints)
                  )})</td>
                  <td style="padding: 4px 0; text-align: right; font-family: 'Courier New', Courier, monospace; color: #18191B;">${escapeHtml(
                    formatCentsToCurrency(taxAmountCents, currency)
                  )}</td>
                </tr>`
              : ''
          }
          <tr>
            <td></td>
            <td style="padding: 8px 0; border-top: 1.5px solid #18191B; border-bottom: 2px solid #18191B; font-family: Georgia, serif; font-weight: 700; text-transform: uppercase; font-size: 12px; color: #18191B;">Balance Due</td>
            <td style="padding: 8px 0; border-top: 1.5px solid #18191B; border-bottom: 2px solid #18191B; text-align: right; font-family: 'Courier New', Courier, monospace; font-weight: 700; font-size: 15px; color: #18191B;">${escapeHtml(
              totalFormatted
            )}</td>
          </tr>
        </table>
      </div>`
      : '';

  const notesAndTermsHtml =
    notes || termsConditions
      ? `
      <div style="margin: 20px 0; padding: 12px 14px; background-color: #F3EFEA; border-left: 3px solid #5C5E62; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px;">
        ${
          notes
            ? `<div style="margin-bottom: ${termsConditions ? '10px' : '0'};">
                <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #5C5E62; font-weight: 700; margin-bottom: 3px;">Notes &amp; Instructions</div>
                <div style="color: #18191B; line-height: 1.5;">${escapeHtml(notes)}</div>
              </div>`
            : ''
        }
        ${
          termsConditions
            ? `<div>
                <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #5C5E62; font-weight: 700; margin-bottom: 3px;">Terms &amp; Conditions</div>
                <div style="color: #18191B; line-height: 1.5;">${escapeHtml(termsConditions)}</div>
              </div>`
            : ''
        }
      </div>`
      : '';

  const wireRemittanceHtml = organization
    ? `
      <div style="margin: 24px 0 12px; padding: 14px; border: 1px solid #E6E1D9; background-color: #F3EFEA; border-radius: 2px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px;">
        <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: #5C5E62; font-weight: 700; margin-bottom: 8px;">Wire Transfer / Remittance Instructions</div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 4px 0; width: 50%;">
              <span style="font-size: 10px; text-transform: uppercase; color: #5C5E62; display: block;">Beneficiary Bank</span>
              <strong style="font-family: 'Courier New', Courier, monospace; color: #18191B;">${escapeHtml(
                organization.bankName || 'Direct Wire Transfer'
              )}</strong>
            </td>
            <td style="padding: 4px 0; width: 50%;">
              <span style="font-size: 10px; text-transform: uppercase; color: #5C5E62; display: block;">Account Holder</span>
              <strong style="font-family: 'Courier New', Courier, monospace; color: #18191B;">${escapeHtml(
                organization.accountHolderName || organization.companyName || ''
              )}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding: 4px 0;">
              <span style="font-size: 10px; text-transform: uppercase; color: #5C5E62; display: block;">Routing / ABA</span>
              <strong style="font-family: 'Courier New', Courier, monospace; color: #18191B;">${escapeHtml(
                organization.routingNumber || '—'
              )}</strong>
            </td>
            <td style="padding: 4px 0;">
              <span style="font-size: 10px; text-transform: uppercase; color: #5C5E62; display: block;">Account Number</span>
              <strong style="font-family: 'Courier New', Courier, monospace; color: #18191B;">${escapeHtml(
                organization.accountNumber || '—'
              )}</strong>
            </td>
          </tr>
        </table>
      </div>`
    : '';

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
      max-width: 640px;
      margin: 0 auto;
      background-color: #FAF8F5;
      border: 1px solid #E6E1D9;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      border-radius: 2px;
      overflow: hidden;
    }
    .header {
      padding: 36px 36px 20px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      letter-spacing: -0.02em;
      text-transform: uppercase;
      font-weight: 700;
      color: #18191B;
    }
    .header p {
      margin: 4px 0 0;
      font-family: 'Courier New', Courier, monospace;
      font-size: 10px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #5C5E62;
    }
    .content {
      padding: 0 36px 36px;
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
      margin: 20px 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      background-color: #F3EFEA;
      border: 1px solid #E6E1D9;
    }
    .metadata-table td {
      padding: 10px 14px;
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
      font-size: 14px;
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
      ${
        organization?.letterheadTagline
          ? `<p>${escapeHtml(organization.letterheadTagline)}</p>`
          : ''
      }
    </div>
    <div class="content">
      <div class="greeting">
        ${greetingHtml}
      </div>

      ${partyBlockHtml}

      <table class="metadata-table">
        <tr>
          <td class="label">Invoice No.</td>
          <td class="val">${escapeHtml(invoiceNumber)}</td>
        </tr>
        ${
          issueDateFormatted
            ? `<tr>
                <td class="label">Issue Date</td>
                <td class="val">${escapeHtml(issueDateFormatted)}</td>
              </tr>`
            : ''
        }
        <tr>
          <td class="label">Due Date</td>
          <td class="val">${escapeHtml(dueDateFormatted)}</td>
        </tr>
        <tr>
          <td class="label">Total Balance Due</td>
          <td class="val">${escapeHtml(totalFormatted)}</td>
        </tr>
      </table>

      ${lineItemsHtml}
      ${notesAndTermsHtml}
      ${wireRemittanceHtml}

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
      An official US Letter PDF copy of Invoice ${escapeHtml(invoiceNumber)} is attached to this email.
    </div>
  </div>
</body>
</html>
  `;

  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      const buildSendPayload = (
        fromAddress: string,
        overrideTo?: string[],
        overrideCc?: string[],
        overrideBcc?: string[]
      ) => {
        const activeTo = overrideTo ?? toList;
        const activeCc = overrideCc ?? ccList;
        const activeBcc = overrideBcc ?? bccList;
        return {
          from: fromAddress,
          to: activeTo,
          ...(activeCc.length > 0 ? { cc: activeCc } : {}),
          ...(activeBcc.length > 0 ? { bcc: activeBcc } : {}),
          ...(replyToEmail ? { replyTo: replyToEmail } : {}),
          subject: subjectLine,
          html: htmlContent,
          ...(pdfBuffer
            ? {
                attachments: [
                  {
                    filename: `Invoice-${invoiceNumber}.pdf`,
                    content: pdfBuffer,
                  },
                ],
              }
            : {}),
        };
      };

      let activeFrom = senderFrom;
      let result = await resend.emails.send(buildSendPayload(activeFrom));

      // 1. If a custom domain in senderFrom is not yet verified in Resend, automatically fall back to onboarding@resend.dev
      if (
        result.error &&
        /domain is not verified/i.test(result.error.message || '') &&
        !activeFrom.includes('onboarding@resend.dev')
      ) {
        activeFrom = `${extractedName || fromName || "The Architect's Ledger"} <onboarding@resend.dev>`;
        console.warn(
          `[Email Dispatch] Sender domain unverified (${senderFrom}). Retrying automatically with ${activeFrom}...`
        );
        result = await resend.emails.send(buildSendPayload(activeFrom));
      }

      // 2. If Resend free-tier restricts recipients to the account owner's email address, automatically route to testRecipientEmail
      if (
        result.error &&
        /only send testing emails to your own email address/i.test(result.error.message || '')
      ) {
        const matchOwnEmail = (result.error.message || '').match(/\(([^)]+@[^)]+)\)/);
        const fallbackRecipient =
          matchOwnEmail?.[1]?.trim() ||
          organization?.testRecipientEmail?.trim() ||
          'shahjahan.rasell@gmail.com';
        activeFrom = `${extractedName || fromName || "The Architect's Ledger"} <onboarding@resend.dev>`;
        console.warn(
          `[Email Dispatch] Resend sandbox mode active; routing email for [${toList.join(
            ', '
          )}] to verified test inbox ${fallbackRecipient}...`
        );
        result = await resend.emails.send(buildSendPayload(activeFrom, [fallbackRecipient], [], []));
      }

      if (result.error) {
        console.error('Resend API returned error:', result.error);
        return {
          success: false,
          error: result.error.message || JSON.stringify(result.error),
          simulated: false,
        };
      }
      return { success: true, data: result.data, simulated: false };
    } catch (error) {
      console.error('Failed to send email via Resend:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        simulated: false,
      };
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
