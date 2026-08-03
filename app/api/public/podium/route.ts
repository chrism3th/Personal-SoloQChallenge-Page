import { NextResponse } from "next/server";
import { getPublicPodium } from "@/lib/ranking/public-summary";

/**
 * Endpoint público (sin sesión) que sirve el resumen del podio para la
 * portada. El resto de la data del ladder sigue detrás de login.
 */
export async function GET() {
  const data = await getPublicPodium();
  return NextResponse.json(data);
}
