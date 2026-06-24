import { NextResponse } from "next/server";

import { pingDatabase } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const startedAt = Date.now();

  try {
    await pingDatabase();

    return NextResponse.json({
      ok: true,
      database: "ok",
      service: "120-bank",
      latencyMs: Date.now() - startedAt
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        database: "unavailable",
        service: "120-bank",
        message: error instanceof Error && error.message ? error.message : "Database check failed.",
        latencyMs: Date.now() - startedAt
      },
      { status: 503 }
    );
  }
}
