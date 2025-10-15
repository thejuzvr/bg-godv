import { NextResponse } from 'next/server';

export async function GET() {
  const res = NextResponse.json({ ok: true });
  // Set CSRF cookie if missing
  const token = crypto.randomUUID();
  res.cookies.set('csrf_token', token, { httpOnly: false, sameSite: 'lax', path: '/' });
  return res;
}
