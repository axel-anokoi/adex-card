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
      options: {
        emailRedirectTo: undefined, // ANSUT gère la confirmation, pas Supabase
        data: {
          nom: parsed.data.nom,
          prenoms: parsed.data.prenoms,
          telephone: parsed.data.telephone,
        },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }


    // Send welcome email
    try {
      const welcomeHtml = `
        <div style="font-family: 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0a; border: 1px solid #333; border-radius: 16px; overflow: hidden; color: #ffffff;">
          <div style="background: linear-gradient(135deg, #00ffe0, #7b2fff); padding: 4px;">
            <div style="background-color: #0a0a0a; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 2px; background: linear-gradient(135deg, #00ffe0, #7b2fff); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">ADEX CARD</h1>
            </div>
          </div>
          <div style="padding: 40px 30px; line-height: 1.6;">
            <h2 style="font-size: 24px; font-weight: 700; margin-top: 0; margin-bottom: 20px; color: #ffffff;">
              Bonjour ${parsed.data.prenoms} ! <span style="color: #00ffe0;">🚀</span>
            </h2>
            <p style="font-size: 16px; color: #a1a1aa; margin-bottom: 24px;">
              Bienvenue dans l'univers <strong style="color: #00ffe0;">Adex Card</strong>. Votre compte est désormais actif et prêt pour l'action.
            </p>
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(0,255,224,0.2); border-radius: 12px; padding: 20px; margin-bottom: 30px; text-align: center;">
              <p style="font-size: 14px; color: #e4e4e7; margin: 0 0 15px 0;">
                Accédez instantanément aux meilleures cartes gaming (PSN, Xbox, Nintendo, Apple) avec vos moyens de paiement locaux.
              </p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://adex-card.com'}/shop"
                 style="display: inline-block; background: linear-gradient(135deg, #00ffe0, #7b2fff); color: #000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
                Explorer le catalogue
              </a>
            </div>
            <p style="font-size: 13px; color: #71717a; text-align: center;">
              Livraison instantanée &bull; Paiement sécurisé &bull; Support 24/7
            </p>
          </div>
          <div style="background-color: #000; border-top: 1px solid #222; color: #52525b; padding: 20px; text-align: center; font-size: 12px;">
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
