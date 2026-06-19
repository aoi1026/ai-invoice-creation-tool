import { requireUser, ok } from "@/lib/api";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { user } = auth;
  return ok({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    companyName: user.company.name,
  });
}
