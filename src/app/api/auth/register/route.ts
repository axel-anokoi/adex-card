import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { sendMail } from "@/lib/mail";

const registerSchema = z.object({
  email: z.string()
    .email("Adresse email invalide")
    .refine((email) => email.endsWith("@gmail.com") || email.endsWith("@yahoo.com") || email.endsWith("@outlook.com") || email.endsWith("@hotmail.com"), {
      message: "Utilisez Gmail, Yahoo, Outlook ou Hotmail",
    }),
  password: z.string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
    .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre"),
  nom: z.string().min(1, "Le nom est requis").max(50, "Le nom ne doit pas dépasser 50 caractères"),
  prenoms: z.string().min(1, "Les prénoms sont requis").max(100, "Les prénoms ne doivent pas dépasser 100 caractères"),
  telephone: z.string()
    .min(1, "Le téléphone est requis")
    .regex(/^\+?[\d\s\-()]+$/, "Numéro de téléphone invalide")
    .refine((tel) => {
      const digits = tel.replace(/\D/g, "");
      return digits.length >= 8 && digits.length <= 15;
    }, "Le numéro doit contenir entre 8 et 15 chiffres"),
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

//      const { error: profileError } = await supabase
//         .from("users")
// .insert({
//           id: data.user.id,
//           email:  parsed.data.email,
//           role: "client",
//           nom: parsed.data.nom,
//           prenoms: parsed.data.prenoms,
//           telephone: parsed.data.telephone,
//         });

//     return NextResponse.json({ message: "Registration successful. Please check your email to confirm." , data: parsed.data}, { status: 500 });

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
           email:  parsed.data.email,
          role: "client",
          nom: parsed.data.nom,
          prenoms: parsed.data.prenoms,
          telephone: parsed.data.telephone,
        });

      if (profileError) {
        console.error("Profile creation error:", profileError);
        return NextResponse.json(
          { error: "Failed to create user profile" },
          { status: 500 }
        );
      }
    }

    // Send welcome email
    try {
      const welcomeHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #1a1a1a; color: #ffffff; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">ADEX CARD</h1>
          </div>
          <div style="padding: 30px; background-color: #ffffff; color: #333333; line-height: 1.6;">
            <h2 style="color: #1a1a1a; margin-top: 0;">Bonjour ${parsed.data.prenoms} ! 👋</h2>
            <p>Nous sommes ravis de vous accueillir dans la communauté <strong>Adex Card</strong>.</p>
            <p>Votre compte a été créé avec succès. Vous pouvez désormais explorer notre boutique et profiter de nos offres exclusives.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://adex-card.com'}/shop"
                 style="background-color: #0070f3; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Découvrir la boutique
              </a>
            </div>
            <p style="font-size: 14px; color: #666666;">Si vous avez des questions, n'hésitez pas à répondre à cet email.</p>
          </div>
          <div style="background-color: #f9f9f9; color: #999999; padding: 20px; text-align: center; font-size: 12px;">
            &copy; ${new Date().getFullYear()} Adex Card. Tous droits réservés.
          </div>
        </div>
      `;

      await sendMail({
        to: parsed.data.email,
        subject: "Bienvenue chez Adex Card ! 🚀",
        text: `Bonjour ${parsed.data.prenoms}, bienvenue chez Adex Card ! Nous sommes ravis de vous compter parmi nous. Rendez-vous sur notre boutique pour découvrir nos produits.`,
        html: welcomeHtml,
      });
    } catch (mailError) {
      console.error("Welcome email error:", mailError);
      // We don't block registration if the welcome email fails
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
