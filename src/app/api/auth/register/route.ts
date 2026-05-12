import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Create user profile in public.users table
    if (data.user) {
      const { error: profileError } = await supabase
        .from("users")
        .insert({
          id: data.user.id,
          email: data.user.email,
          role: "client",
        });

      if (profileError) {
        console.error("Profile creation error:", profileError);
        return NextResponse.json(
          { error: "Failed to create user profile" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { message: "Registration successful. Please check your email to confirm.", user: data.user },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
