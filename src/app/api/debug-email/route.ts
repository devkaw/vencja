import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: 'Debug endpoint removed' }, { status: 404 });
}
