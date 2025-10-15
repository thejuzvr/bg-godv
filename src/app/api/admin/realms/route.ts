import { NextResponse } from 'next/server';
import { db } from '@/../server/storage';
import { realms } from '@/../shared/schema';

export async function GET() {
  const rows = await db.select().from(realms);
  return NextResponse.json(rows.map(r => ({ id: (r as any).id, name: (r as any).name, status: (r as any).status })));
}
