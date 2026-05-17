import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const blockUserSchema = z.object({
  is_blocked: z.boolean(),
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

// PUT: Block/unblock user
export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { isAdmin, supabase } = await checkAdmin();

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = blockUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("users")
      .update({ is_blocked: parsed.data.is_blocked })
      .eq("id", id)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: parsed.data.is_blocked ? "User blocked" : "User unblocked",
      user: data[0],
    });
  } catch (error) {
    console.error("Block user error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
