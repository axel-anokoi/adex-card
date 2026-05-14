import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendMail } from '@/lib/mail';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ message: 'Si cet email est enregistré, vous recevrez un code OTP.' }, { status: 200 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    const { error: otpError } = await supabase
      .from('password_reset_otps')
      .insert({
        user_id: user.id,
        otp,
        expires_at: expiresAt.toISOString(),
      });

    if (otpError) {
      console.error('Error storing OTP:', otpError);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    try {
      await sendMail({
        to: email,
        subject: '🔐 Réinitialisation de votre mot de passe - AdexCard',
        text: `Votre code de vérification pour réinitialiser votre mot de passe est : ${otp}. Ce code expire dans 15 minutes.`,
        html: `
          <div style="background-color: #0a0a0a; color: #ffffff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; border-radius: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #333;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="font-size: 24px; font-weight: 800; background: linear-gradient(135deg, #00ffe0, #7b2fff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0;">AdexCard</h1>
              <p style="color: #888; font-size: 14px; margin-top: 10px;">Sécurité de votre compte</p>
            </div>
            <div style="background: linear-gradient(145deg, #111, #1a1a1a); padding: 30px; border-radius: 15px; border: 1px solid #333; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
              <p style="font-size: 16px; color: #ccc; margin-bottom: 20px;">Bonjour,</p>
              <p style="font-size: 14px; color: #aaa; line-height: 1.6; margin-bottom: 25px;">
                Vous avez demandé la réinitialisation de votre mot de passe. Utilisez le code suivant pour continuer :
              </p>
              <div style="font-size: 32px; font-weight: 800; color: #00ffe0; letter-spacing: 8px; margin: 20px 0; padding: 15px; background: rgba(0,255,224,0.05); border-radius: 10px; border: 1px dashed #00ffe0;">
                ${otp}
              </div>
              <p style="font-size: 12px; color: #666; margin-top: 25px;">
                Ce code est valable pendant 15 minutes. Si vous n'avez pas demandé ce changement, vous pouvez ignorer cet email.
              </p>
            </div>
            <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #444;">
              &copy; ${new Date().getFullYear()} AdexCard. Tous droits réservés.
            </div>
          </div>
        `,
      });
    } catch (mailError) {
      console.error('Mail sending error:', mailError);
      return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 });
    }

    return NextResponse.json({ message: 'OTP sent successfully' }, { status: 200 });
  } catch (error) {
    console.error('Forgot password request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
