import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const { email, otp, password } = await req.json();

    if (!email || !otp || !password) {
      return NextResponse.json({ error: 'Email, OTP and password are required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { data: validOtp, error: verifyError } = await supabase
      .from('password_reset_otps')
      .select('id')
      .eq('user_id', user.id)
      .eq('otp', otp)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (verifyError || !validOtp) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
    }

    await supabase
      .from('password_reset_otps')
      .update({ is_used: true })
      .eq('id', validOtp.id);

    return NextResponse.json({ message: 'Password updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
