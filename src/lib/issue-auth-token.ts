import { createAdminClient } from '@/lib/supabase/client';
import { generateToken, hashToken, TOKEN_TTL_MS, MAX_TOKENS_PER_HOUR } from '@/lib/auth-tokens';

type TokenType = 'verification' | 'reset';

type IssueResult =
  | { status: 'issued'; token: string; userName: string }
  | { status: 'no_user' }
  | { status: 'rate_limited' }
  | { status: 'error' };

export async function issueAuthToken(email: string, type: TokenType): Promise<IssueResult> {
  const supabase = createAdminClient();
  const normalizedEmail = email.toLowerCase().trim();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (!profile) {
    return { status: 'no_user' };
  }

  // Counts every token issued in the window, used or not, so re-requesting
  // (which invalidates the previous token) can't reset the limit.
  const oneHourAgo = new Date(Date.now() - TOKEN_TTL_MS).toISOString();
  const { count, error: countError } = await supabase
    .from('auth_tokens')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', profile.id)
    .eq('type', type)
    .gte('created_at', oneHourAgo);

  if (countError) {
    console.error('[auth-token] count error:', countError.message);
    return { status: 'error' };
  }

  if ((count ?? 0) >= MAX_TOKENS_PER_HOUR) {
    return { status: 'rate_limited' };
  }

  await supabase
    .from('auth_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('user_id', profile.id)
    .eq('type', type)
    .is('used_at', null);

  const token = generateToken();
  const { error: insertError } = await supabase.from('auth_tokens').insert({
    user_id: profile.id,
    email: normalizedEmail,
    token: hashToken(token),
    type,
    expires_at: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
  });

  if (insertError) {
    console.error('[auth-token] insert error:', insertError.message);
    return { status: 'error' };
  }

  const { data: userData } = await supabase.auth.admin.getUserById(profile.id);
  const userName = (userData?.user?.user_metadata?.name as string | undefined) || '';

  return { status: 'issued', token, userName };
}
