import { NextResponse } from "next/server";
import { checkGeminiHealth } from "@/lib/gemini";

export const dynamic = "force-dynamic";

/**
 * GET /api/health/gemini
 *
 * Development diagnostic endpoint to test actual Google Gemini API connectivity.
 * Tests generateContent directly using the configured Gemini model.
 * NEVER exposes the API key or credentials.
 */
export async function GET() {
  const result = await checkGeminiHealth();

  if (result.success) {
    return NextResponse.json({
      success: true,
      provider: "Google Gemini",
      model: result.model,
      response: result.response,
      latencyMs: result.latencyMs,
      timestamp: new Date().toISOString(),
    });
  }

  return NextResponse.json(
    {
      success: false,
      provider: "Google Gemini",
      model: result.model,
      errorCode: result.errorCode,
      message: result.message,
      ...(result.httpStatus && { httpStatus: result.httpStatus }),
      timestamp: new Date().toISOString(),
    },
    { status: result.httpStatus && result.httpStatus >= 400 && result.httpStatus < 600 ? result.httpStatus : 503 }
  );
}
