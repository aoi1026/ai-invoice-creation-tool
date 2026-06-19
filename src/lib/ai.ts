import "server-only";
import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-opus-4-8";

export type AIInvoiceDraft = {
  clientName: string;
  clientEmail?: string;
  clientAddress?: string;
  clientTaxId?: string;
  currency: string;
  taxRate: number;
  issueDate?: string;
  dueDate?: string;
  notes?: string;
  paymentTerms?: string;
  items: { description: string; quantity: number; unitPrice: number }[];
};

// JSON schema the model is constrained to. Keeps output strictly parseable.
const INVOICE_SCHEMA = {
  type: "object",
  properties: {
    clientName: { type: "string", description: "Billing recipient / customer name" },
    clientEmail: { type: "string" },
    clientAddress: { type: "string" },
    clientTaxId: { type: "string" },
    currency: {
      type: "string",
      description: "ISO 4217 code, e.g. JPY, USD, EUR. Default JPY if unclear.",
    },
    taxRate: { type: "number", description: "Tax/consumption rate as a percent, e.g. 10" },
    issueDate: { type: "string", description: "YYYY-MM-DD or empty" },
    dueDate: { type: "string", description: "YYYY-MM-DD or empty" },
    notes: { type: "string" },
    paymentTerms: { type: "string" },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          description: { type: "string" },
          quantity: { type: "number" },
          unitPrice: { type: "number" },
        },
        required: ["description", "quantity", "unitPrice"],
        additionalProperties: false,
      },
    },
  },
  required: ["clientName", "currency", "taxRate", "items"],
  additionalProperties: false,
} as const;

function client(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not configured. Add it to .env to enable AI features.",
    );
  }
  return new Anthropic({ apiKey });
}

function firstJson(content: Anthropic.Messages.ContentBlock[]): AIInvoiceDraft {
  const text = content.find((b) => b.type === "text");
  if (!text || text.type !== "text") {
    throw new Error("AI returned no text content");
  }
  return JSON.parse(text.text) as AIInvoiceDraft;
}

const SYSTEM = `You convert informal descriptions and scanned documents into structured invoice data for an invoicing application.
Rules:
- Infer sensible line items with quantity and unit price. Split lump sums into items when described.
- unitPrice and quantity are numbers (no currency symbols, no thousands separators).
- If the user gives a tax-inclusive total, keep unit prices tax-exclusive and set taxRate accordingly.
- Default currency to JPY and taxRate to 10 when not specified.
- Dates must be YYYY-MM-DD. Leave a date empty if unknown rather than guessing wildly.
- Never invent a client name; if absent, use an empty string for clientName's value is not allowed, so use "Customer".`;

export async function generateInvoiceFromText(
  instruction: string,
  context?: { defaultCurrency?: string; today?: string },
): Promise<AIInvoiceDraft> {
  const anthropic = client();
  const today = context?.today ?? new Date().toISOString().slice(0, 10);
  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: SYSTEM,
    output_config: { format: { type: "json_schema", schema: INVOICE_SCHEMA } },
    messages: [
      {
        role: "user",
        content: `Today is ${today}. Default currency ${context?.defaultCurrency ?? "JPY"}.\n\nCreate an invoice from this request:\n\n${instruction}`,
      },
    ],
  });
  return firstJson(msg.content);
}

const SUPPORTED_IMAGE = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

export async function extractInvoiceFromFile(
  base64Data: string,
  mediaType: string,
): Promise<AIInvoiceDraft> {
  const anthropic = client();
  const today = new Date().toISOString().slice(0, 10);

  const source =
    mediaType === "application/pdf"
      ? ({
          type: "base64" as const,
          media_type: "application/pdf" as const,
          data: base64Data,
        })
      : null;

  const block: Anthropic.Messages.ContentBlockParam =
    mediaType === "application/pdf"
      ? { type: "document", source: source! }
      : {
          type: "image",
          source: {
            type: "base64",
            media_type: mediaType as
              | "image/jpeg"
              | "image/png"
              | "image/gif"
              | "image/webp",
            data: base64Data,
          },
        };

  if (mediaType !== "application/pdf" && !SUPPORTED_IMAGE.has(mediaType)) {
    throw new Error(`Unsupported file type: ${mediaType}`);
  }

  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: SYSTEM,
    output_config: { format: { type: "json_schema", schema: INVOICE_SCHEMA } },
    messages: [
      {
        role: "user",
        content: [
          block,
          {
            type: "text",
            text: `Today is ${today}. Extract all invoice data from this document — recipient, dates, every line item with quantity and unit price, tax rate, currency, and any payment terms or notes. Transcribe numbers exactly as shown.`,
          },
        ],
      },
    ],
  });
  return firstJson(msg.content);
}
