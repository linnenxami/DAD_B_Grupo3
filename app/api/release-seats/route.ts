import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { seatIds } = body;
    
    if (seatIds && Array.isArray(seatIds) && seatIds.length > 0) {
      await prisma.asientoViaje.updateMany({
        where: { 
          id: { in: seatIds.map((id: string) => BigInt(id)) }, 
          estado: "pendiente" 
        },
        data: { 
          estado: "disponible"
        }
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error en API release-seats:", e);
    return NextResponse.json({ success: false });
  }
}
