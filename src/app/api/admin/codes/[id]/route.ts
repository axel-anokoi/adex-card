import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const updateCodeSchema = z.object({
  buy_price: z.number().nonnegative().optional(),
  expires_at: z.string().optional(),
  status: z.enum(["available", "sold", "reserved", "refunded", "expired"]).optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function checkAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { isAdmin: false, user: null, supabase };
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  return { isAdmin: userData?.role === "admin", user, supabase };
}

// PUT: Update a code
export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
const { isAdmin, supabase } = await checkAdmin();

    if (!isAdmin || !supabase) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateCodeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("gift_codes")
      .update(parsed.data)
      .eq("id", id)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Code not found" }, { status: 404 });
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error("Code update error:", error);
    return NextResponse.json({ error: "Failed to update code" }, { status: 500 });
  }
}

// DELETE: Delete a code
export async function DELETE(_: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
const { isAdmin, supabase } = await checkAdmin();

    if (!isAdmin || !supabase) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if code is already sold
    const { data: code } = await supabase
      .from("gift_codes")
      .select("status")
      .eq("id", id)
      .single();

    if (code?.status !== "available") {
      return NextResponse.json({ error: "Can only delete available codes" }, { status: 400 });
    }

    const { error } = await supabase.from("gift_codes").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Code deleted" }, { status: 200 });
  } catch (error) {
    console.error("Code deletion error:", error);
    return NextResponse.json({ error: "Failed to delete code" }, { status: 500 });
  }
}
