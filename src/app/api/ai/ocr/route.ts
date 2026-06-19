import { requireUser, ok, fail } from "@/lib/api";
import { extractInvoiceFromFile } from "@/lib/ai";

export const maxDuration = 60;

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

export async function POST(req: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return fail("ドキュメントまたは画像ファイルをアップロードしてください", 400);
  }
  if (file.size > MAX_BYTES) {
    return fail("ファイルサイズが大きすぎます（最大15MB）", 400);
  }

  const allowed = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
  ];
  if (!allowed.includes(file.type)) {
    return fail(`対応していないファイル形式です: ${file.type || "不明"}`, 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");

  try {
    const draft = await extractInvoiceFromFile(base64, file.type);
    return ok({ draft });
  } catch (err) {
    const message = err instanceof Error ? err.message : "OCR抽出に失敗しました";
    const status = message.includes("ANTHROPIC_API_KEY") ? 503 : 502;
    return fail(message, status);
  }
}
