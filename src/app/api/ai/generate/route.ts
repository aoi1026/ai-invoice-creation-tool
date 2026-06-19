import { requireUser, ok, fail } from "@/lib/api";
import { generateInvoiceFromText } from "@/lib/ai";

export const maxDuration = 60;

export async function POST(req: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const instruction = (body?.instruction as string | undefined)?.trim();
  if (!instruction) return fail("Describe the invoice you want to create", 400);
  if (instruction.length > 8000) return fail("Instruction is too long", 400);

  try {
    const draft = await generateInvoiceFromText(instruction, {
      defaultCurrency: body?.defaultCurrency,
    });
    return ok({ draft });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI generation failed";
    const status = message.includes("ANTHROPIC_API_KEY") ? 503 : 502;
    return fail(message, status);
  }
}
