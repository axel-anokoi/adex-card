import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendImplicitAccountActivationEmail } from "@/app/api/checkout/route";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Adresse email invalide" }, { status: 400 });
    }

    const { email } = parsed.data;
    const supabase = createAdminClient();

    // Find user profile by email
    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    // Return success regardless to not reveal whether an account exists
    if (!profile) {
      return NextResponse.json({ success: true });
    }

    // Get auth user to check if it's an implicit (unactivated) account
    const { data: authData, error: authError } = await supabase.auth.admin.getUserById(profile.id);

    if (authError || !authData.user) {
      return NextResponse.json({ success: true });
    }

    if (!authData.user.user_metadata?.implicit_checkout) {
      // Account already activated or not an implicit account — silently succeed
      return NextResponse.json({ success: true });
    }

    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${origin}/auth/callback?next=/activate` },
    });

    if (linkError) {
      console.error("resend-activation: generateLink failed:", linkError);
      return NextResponse.json({ error: "Impossible de générer le lien d'activation" }, { status: 500 });
    }

    const activationLink = linkData.properties?.action_link ?? null;
    const customerName =
      authData.user.user_metadata?.prenoms ||
      email.split("@")[0];

    await sendImplicitAccountActivationEmail(email, customerName, activationLink);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("resend-activation error:", error);
    return NextResponse.json({ error: "Erreur lors de l'envoi de l'email" }, { status: 500 });
  }
}
