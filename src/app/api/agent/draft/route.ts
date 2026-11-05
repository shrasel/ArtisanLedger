import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

interface DraftInvoiceToolResult {
  clientName: string;
  currency: string;
  dueDateOffsetDays: number;
  items: Array<{
    description: string;
    quantity: number;
    unitPriceCents: number;
  }>;
  notes: string;
}

/**
 * Deterministic semantic parser fallback for intent-to-invoice
 * Parses natural language commands into the structured tool call output
 */
function parseIntentFallback(prompt: string): DraftInvoiceToolResult {
  const result: DraftInvoiceToolResult = {
    clientName: '',
    currency: 'USD',
    dueDateOffsetDays: 30,
    items: [],
    notes: '',
  };

  // Detect currency (guarding against CAD drafting / CAD modeling)
  if (/\b(eur|euro|€)\b/i.test(prompt)) result.currency = 'EUR';
  else if (/\b(gbp|pound|£)\b/i.test(prompt)) result.currency = 'GBP';
  else if (
    /\b(?:cad\s*\$|c\$|cad\s+dollars?)\b/i.test(prompt) ||
    (/\bcad\b/i.test(prompt) && !/\bcad\s+(?:draft|model|design|file|software|drawing|plan)/i.test(prompt))
  ) {
    result.currency = 'CAD';
  }

  // Detect due date offset
  const netMatch =
    prompt.match(/\bnet\s*(\d+)\b/i) || prompt.match(/due\s+(?:in\s+)?(\d+)\s+days/i);
  if (netMatch) {
    result.dueDateOffsetDays = parseInt(netMatch[1], 10);
  } else if (/due\s+on\s+receipt/i.test(prompt) || /immediate/i.test(prompt)) {
    result.dueDateOffsetDays = 0;
  }

  // Remove trailing Net terms / due date phrases from a working copy for cleaner item parsing
  const cleanedPrompt = prompt
    .replace(/,?\s*\bnet\s*\d+\b/gi, '')
    .replace(/,?\s*\bdue\s+(?:on\s+receipt|(?:in\s+)?\d+\s+days)\b/gi, '')
    .trim();

  // Detect Client Name
  // e.g., "Invoice Acme Corp $500...", "Bill Metro Studio for...", "Client: Acme Co"
  const explicitClientMatch = cleanedPrompt.match(
    /(?:client|customer|billed\s+to)\s*[:=]\s*([A-Za-z0-9\s&.'-]+?)(?:\s*,|\s+for\b|\s*\$|\s*$)/i
  );
  const verbClientMatch = cleanedPrompt.match(
    /^(?:please\s+)?(?:bill|invoice|charge)\s+([A-Za-z0-9\s&.'-]+?)(?=\s+for\b|\s*\$|\s+\d+\s+(?:hrs?|hours?|units?|days?|items?)\b|\s*,)/i
  );

  const rawClientCandidate = (explicitClientMatch?.[1] || verbClientMatch?.[1] || '').trim();
  if (
    rawClientCandidate &&
    !/^(the|a|an|me|client|customer|payment|project|hours|work|for|new|draft|create)$/i.test(
      rawClientCandidate
    ) &&
    !/^\d/.test(rawClientCandidate)
  ) {
    result.clientName = rawClientCandidate;
  }

  // Strip leading "Bill <Client>" prefix so item descriptions don't include the client name
  let itemsText = cleanedPrompt;
  if (result.clientName) {
    const escapedClient = result.clientName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    itemsText = itemsText
      .replace(new RegExp(`^(?:please\\s+)?(?:bill|invoice|charge)\\s+${escapedClient}\\s*`, 'i'), '')
      .replace(new RegExp(`(?:client|customer|billed\\s+to)\\s*[:=]\\s*${escapedClient}\\s*,?\\s*`, 'i'), '')
      .trim();
  } else {
    itemsText = itemsText
      .replace(/^(?:please\s+)?(?:create\s+an?\s+|draft\s+an?\s+|make\s+an?\s+)?(?:bill|invoice|charge)\s+(?:for\s+)?/i, '')
      .trim();
  }

  // Split into item clauses only on commas (not inside numbers), semicolons, newlines,
  // or " and " ONLY when followed by a number/dollar amount in the next clause
  const clauses = itemsText
    .split(/(?:(?<!\d),(?!\d)|;|\n|\band\b(?=[^,;]*?(?:\$|\d+\s*(?:hrs?|hours?|units?|items?|days?|x|@|\bat\b))))/i)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const part of clauses) {
    // Pattern 1: Quantity + Description + Unit Rate
    // e.g. "12 hrs CAD drafting at $150/hr", "5 hours of consulting @ $200", "3x Site Visits at $250"
    const qtyRateMatch = part.match(
      /^(\d+)\s*(?:x|hrs?|hours?|units?|items?|days?|weeks?|sessions?)?\s*(?:of\s+)?(.+?)\s+(?:at|@)\s*\$?([\d,]+(?:\.\d{1,2})?)(?:\s*\/\s*[a-z]+|\s+each)?$/i
    );
    if (qtyRateMatch) {
      const qty = parseInt(qtyRateMatch[1], 10);
      const desc = qtyRateMatch[2].replace(/^(?:for|of|-|:)\s+/i, '').trim();
      const rateDollars = parseFloat(qtyRateMatch[3].replace(/,/g, ''));
      if (desc && !isNaN(rateDollars)) {
        result.items.push({
          description: desc.charAt(0).toUpperCase() + desc.slice(1),
          quantity: isNaN(qty) || qty <= 0 ? 1 : qty,
          unitPriceCents: Math.round(rateDollars * 100),
        });
        continue;
      }
    }

    // Pattern 2: "$6,500 for Architectural Schematics"
    const amountFirstMatch = part.match(
      /^\$?([\d,]+(?:\.\d{1,2})?)\s+(?:for|worth\s+of|on|-|:)\s+(.+)$/i
    );
    if (amountFirstMatch) {
      const amount = parseFloat(amountFirstMatch[1].replace(/,/g, ''));
      const desc = amountFirstMatch[2].trim();
      if (desc && !isNaN(amount)) {
        result.items.push({
          description: desc.charAt(0).toUpperCase() + desc.slice(1),
          quantity: 1,
          unitPriceCents: Math.round(amount * 100),
        });
        continue;
      }
    }

    // Pattern 3: "Website Redesign for $3,500" or "Item 1 $1300" or "Item 2: $200"
    const descFirstMatch = part.match(
      /^(.+?)\s*(?:for|costing|totaling|at|@|:|-|\$)\s*\$?([\d,]+(?:\.\d{1,2})?)$/i
    );
    if (descFirstMatch) {
      const desc = descFirstMatch[1]
        .replace(/^(?:for|bill|invoice|charge)\s+/i, '')
        .trim();
      const amount = parseFloat(descFirstMatch[2].replace(/,/g, ''));
      if (desc && !isNaN(amount)) {
        result.items.push({
          description: desc.charAt(0).toUpperCase() + desc.slice(1),
          quantity: 1,
          unitPriceCents: Math.round(amount * 100),
        });
        continue;
      }
    }
  }

  // Fallback if a single dollar amount was given without matching the above patterns
  if (result.items.length === 0) {
    const fallbackDollar = itemsText.match(/\$?([\d,]+(?:\.\d{1,2})?)/);
    const amount = fallbackDollar ? parseFloat(fallbackDollar[1].replace(/,/g, '')) : 0;
    const leftoverDesc = itemsText
      .replace(/\$?[\d,]+(?:\.\d{1,2})?/, '')
      .replace(/^(?:for|of|:|-)\s+/i, '')
      .replace(/\s+(?:for|of|:|-)$/i, '')
      .trim();

    if (amount > 0 || leftoverDesc) {
      result.items.push({
        description:
          leftoverDesc.length > 1
            ? leftoverDesc.charAt(0).toUpperCase() + leftoverDesc.slice(1)
            : 'Professional Architectural & Design Services',
        quantity: 1,
        unitPriceCents: Math.round((amount || 1000) * 100),
      });
    }
  }

  return result;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Check if OPENAI_API_KEY is available for LLM tool calling
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content:
                  'You are an expert bookkeeping assistant for "The Architect\'s Ledger". Your job is to parse unstructured human text into a structured invoice draft payload. Always convert dollar amounts into integer cents (e.g., $100 -> 10000). Parse dates or relative offsets (e.g., "Net 30" -> calculate due date 30 days ahead).',
              },
              { role: 'user', content: prompt },
            ],
            tools: [
              {
                type: 'function',
                function: {
                  name: 'draftInvoice',
                  description: 'Populates an invoice draft from plain text instructions',
                  parameters: {
                    type: 'object',
                    properties: {
                      clientName: { type: 'string', description: 'Name of the client or company (empty string if not specified)' },
                      currency: { type: 'string', default: 'USD', description: '3-letter currency code' },
                      dueDateOffsetDays: {
                        type: 'number',
                        default: 30,
                        description: 'Days from issue date when invoice is due (e.g. 15, 30)',
                      },
                      items: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            description: { type: 'string' },
                            quantity: { type: 'number' },
                            unitPriceCents: {
                              type: 'number',
                              description: 'Unit price in integer cents (e.g. $150 -> 15000)',
                            },
                          },
                          required: ['description', 'quantity', 'unitPriceCents'],
                        },
                      },
                      notes: { type: 'string', description: 'Additional terms or client notes' },
                    },
                    required: ['items'],
                  },
                },
              },
            ],
            tool_choice: { type: 'function', function: { name: 'draftInvoice' } },
          }),
        });

        if (response.ok) {
          const completion = await response.json();
          const toolCall = completion.choices?.[0]?.message?.tool_calls?.[0];
          if (toolCall?.function?.arguments) {
            const parsedArgs = JSON.parse(toolCall.function.arguments);
            return NextResponse.json({
              success: true,
              data: parsedArgs,
              engine: 'openai',
            });
          }
        }
      } catch (llmErr) {
        console.warn('OpenAI tool call failed, using deterministic parser fallback:', llmErr);
      }
    }

    // High quality deterministic fallback parser
    const structuredDraft = parseIntentFallback(prompt);
    return NextResponse.json({
      success: true,
      data: structuredDraft,
      engine: 'deterministic-parser',
    });
  } catch (error: unknown) {
    console.error('Agent draft error:', error);
    return NextResponse.json({ error: 'Failed to parse invoice intent' }, { status: 500 });
  }
}
