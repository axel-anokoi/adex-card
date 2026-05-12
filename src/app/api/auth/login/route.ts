import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    // Check user role and status
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role, is_blocked")
      .eq("id", data.user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User profile not found" }, { status: 500 });
    }

    if (userData.is_blocked) {
      return NextResponse.json({ error: "Your account has been blocked" }, { status: 403 });
    }

    return NextResponse.json(
      { message: "Login successful", user: data.user, role: userData.role },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
