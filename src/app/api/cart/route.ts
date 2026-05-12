import { NextResponse } from "next/server";
import { z } from "zod";

const cartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate cart items
    const items = z.array(cartItemSchema).safeParse(body.items);

    if (!items.success) {
      return NextResponse.json(
        { error: "Invalid cart items", details: items.error.flatten() },
        { status: 400 }
      );
    }

    // TODO: Implement server-side cart validation against database
    // For now, just return the items as-is (client will use localStorage)

    return NextResponse.json({ items: items.data }, { status: 200 });
  } catch (error) {
    console.error("Cart error:", error);
    return NextResponse.json({ error: "Failed to process cart" }, { status: 500 });
  }
}
