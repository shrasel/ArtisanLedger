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
    notes: `Generated via Intent-to-Invoice Copilot from prompt: "${prompt}"`,
  };

  // Detect currency (guarding against CAD drafting / CAD modeling)
  if (/\b(eur|euro|€)\b/i.test(prompt)) result.currency = 'EUR';
  else if (/\b(gbp|pound|£)\b/i.test(prompt)) result.currency = 'GBP';
  else if (/\b(?:cad\s*\$|c\$|cad\s+dollars?)\b/i.test(prompt) || (/\bcad\b/i.test(prompt) && !/\bcad\s+(?:draft|model|design|file|software)/i.test(prompt))) {
    result.currency = 'CAD';
  }

  // Detect due date offset
  const netMatch = prompt.match(/\bnet\s*(\d+)\b/i) || prompt.match(/due\s+(?:in\s+)?(\d+)\s+days/i);
  if (netMatch) {
    result.dueDateOffsetDays = parseInt(netMatch[1], 10);
  } else if (/due\s+on\s+receipt/i.test(prompt) || /immediate/i.test(prompt)) {
    result.dueDateOffsetDays = 0;
  }

  // Detect Client Name
  // e.g., "Invoice Acme Corp for...", "Bill Studio Mono for...", "Client: Acme Co"
  const clientMatch =
    prompt.match(/(?:bill|invoice|charge|to)\s+([A-Za-z0-9\s&.,'-]+?)(?:\s+for|\s*\$|\s+regarding|\s+with|\s+due|\s*:\s*|\s*,\s*|$)/i) ||
    prompt.match(/(?:client|customer)\s*[:=]\s*([A-Za-z0-9\s&.,'-]+?)(?:\s*,|\s*for|\s*\$|\s*$)/i);

  if (clientMatch && clientMatch[1]) {
    const rawClient = clientMatch[1].trim();
    // Filter out common verbs
    if (!/^(the|a|an|payment|project|hours|work)$/i.test(rawClient)) {
      result.clientName = rawClient;
    }
  }

  // Parse items and amounts
  // Patterns like:
  // "3 hours of consulting at $150/hr"
  // "Brand Identity design for $4,500"
  // "10 units of drafting at $120 each"
  // "$2,500 for Architectural Blueprinting"
  // Split on clause separators while preserving comma inside numbers like $8,500
  const sentences = prompt.split(/(?:(?<!\d),(?!\d)|\band\b|\.(?!\d)|\n)/i).map((s) => s.trim()).filter(Boolean);

  for (const part of sentences) {
    // Check for quantity + desc + unit price: e.g., "5 hours of CAD modeling at $120"
    const qtyRateMatch = part.match(/(\d+)\s+(?:hours?|units?|items?|days?)?\s*(?:of\s+)?([^$]+?)\s+(?:at|@)\s*\$?([\d,]+(?:\.\d{2})?)/i);
    if (qtyRateMatch) {
      const qty = parseInt(qtyRateMatch[1], 10);
      const desc = qtyRateMatch[2].replace(/^(for|bill|invoice)\s+/i, '').trim();
      const rateDollars = parseFloat(qtyRateMatch[3].replace(/,/g, ''));
      result.items.push({
        description: desc.charAt(0).toUpperCase() + desc.slice(1),
        quantity: isNaN(qty) ? 1 : qty,
        unitPriceCents: Math.round(rateDollars * 100),
      });
      continue;
    }

    // Check for desc + dollar amount: e.g., "Website Redesign for $3,500" or "$3,500 for Website Redesign"
    const descAmountMatch1 = part.match(/([^$]+?)\s+(?:for|costing|totaling)\s*\$?([\d,]+(?:\.\d{2})?)/i);
    const descAmountMatch2 = part.match(/\$?([\d,]+(?:\.\d{2})?)\s+(?:for|worth\s+of)\s+([^$]+)/i);

    if (descAmountMatch1 && descAmountMatch1[2]) {
      const desc = descAmountMatch1[1].replace(/^(bill|invoice|charge|client\s+[\w\s]+?)\s+/i, '').trim();
      const amount = parseFloat(descAmountMatch1[2].replace(/,/g, ''));
      if (desc && !isNaN(amount)) {
        result.items.push({
          description: desc.charAt(0).toUpperCase() + desc.slice(1),
          quantity: 1,
          unitPriceCents: Math.round(amount * 100),
        });
        continue;
      }
    } else if (descAmountMatch2 && descAmountMatch2[1]) {
      const amount = parseFloat(descAmountMatch2[1].replace(/,/g, ''));
      const desc = descAmountMatch2[2].trim();
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

  // If no items were parsed but there's a dollar amount anywhere
  if (result.items.length === 0) {
    const fallbackDollar = prompt.match(/\$?([\d,]+(?:\.\d{2})?)/);
    const amount = fallbackDollar ? parseFloat(fallbackDollar[1].replace(/,/g, '')) : 1000;
    result.items.push({
      description: 'Professional Architectural & Design Services',
      quantity: 1,
      unitPriceCents: Math.round(amount * 100),
    });
  }

  if (!result.clientName) {
    result.clientName = 'Corporate Client';
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
                      clientName: { type: 'string', description: 'Name of the client or company' },
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
                    required: ['clientName', 'items'],
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

