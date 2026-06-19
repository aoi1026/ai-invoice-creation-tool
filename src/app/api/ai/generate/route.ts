import { requireUser, ok, fail } from "@/lib/api";
import { generateInvoiceFromText } from "@/lib/ai";

export const maxDuration = 60;

export async function POST(req: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const instruction = (body?.instruction as string | undefined)?.trim();
  if (!instruction) return fail("作成したい請求書の内容を入力してください", 400);
  if (instruction.length > 8000) return fail("入力が長すぎます", 400);

  try {
    const draft = await generateInvoiceFromText(instruction, {
      defaultCurrency: body?.defaultCurrency,
    });
    return ok({ draft });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI生成に失敗しました";
    const status = message.includes("ANTHROPIC_API_KEY") ? 503 : 502;
    return fail(message, status);
  }
}
