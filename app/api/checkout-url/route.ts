import { z } from "zod";
import { createCheckoutUrl } from "@/lib/lemonsqueezy";

const BodySchema = z.object({
  successUrl: z.string().url(),
  cancelUrl: z.string().url().optional(),
});

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = BodySchema.parse(body);

    const url = await createCheckoutUrl(payload);
    if (!url) {
      return Response.json({ error: "Missing Lemon Squeezy checkout configuration." }, { status: 500 });
    }

    return Response.json({ url });
  } catch {
    return Response.json({ error: "Could not create checkout URL." }, { status: 400 });
  }
}
