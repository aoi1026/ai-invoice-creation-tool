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
      "ANTHROPIC_API_KEY が設定されていません。.env に設定するとAI機能が有効になります。",
    );
  }
  return new Anthropic({ apiKey });
}

function firstJson(content: Anthropic.Messages.ContentBlock[]): AIInvoiceDraft {
  const text = content.find((b) => b.type === "text");
  if (!text || text.type !== "text") {
    throw new Error("AIからテキストが返されませんでした");
  }
  return JSON.parse(text.text) as AIInvoiceDraft;
}

const SYSTEM = `あなたは、日本の請求書アプリ向けに、自由記述の説明やスキャンしたドキュメントから構造化された請求書データを生成するアシスタントです。
ルール:
- これは日本のシステムです。clientName・description・notes・paymentTerms などのテキストは、入力が日本語の場合は必ず日本語で出力してください。
- 妥当な明細（数量・単価）を推測してください。一式の金額が示された場合は、内容に応じて明細に分解してください。
- unitPrice と quantity は数値のみ（通貨記号や桁区切りカンマを含めない）。
- 税込合計が示された場合は、単価は税抜のままにして、taxRate を適切に設定してください。
- 通貨が指定されない場合は JPY、税率が指定されない場合は 10（消費税10%）を既定値とします。
- 日付は YYYY-MM-DD 形式。不明な場合は推測せず空欄にしてください。
- 請求先名を勝手に創作しないでください。不明な場合は「お客様」を使用してください。`;

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
        content: `本日は ${today} です。既定の通貨は ${context?.defaultCurrency ?? "JPY"} です。\n\n次の依頼内容から請求書を作成してください：\n\n${instruction}`,
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
    throw new Error(`対応していないファイル形式です: ${mediaType}`);
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
            text: `本日は ${today} です。このドキュメントからすべての請求書データを抽出してください — 請求先、各日付、数量と単価を含むすべての明細、税率、通貨、支払条件や備考。数値は記載どおり正確に転記してください。`,
          },
        ],
      },
    ],
  });
  return firstJson(msg.content);
}
