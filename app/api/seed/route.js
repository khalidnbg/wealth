import { seedTransactions } from "@/actions/seed";
import { withArcjetProtection } from "@/lib/security/arcjet";

async function handler() {
  const result = await seedTransactions();
  return Response.json(result);
}

export const GET = withArcjetProtection(handler);
