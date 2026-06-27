import { NextResponse } from "next/server";

export function jsonOk<T>(data: T, init?: ResponseInit): NextResponse<T> {
  return NextResponse.json(data, init);
}

export function jsonError(error: unknown): NextResponse<{ error: string }> {
  const message = error instanceof Error ? error.message : "Unexpected error";
  const status =
    error instanceof Error && "status" in error && typeof error.status === "number" ? error.status : 500;

  return NextResponse.json({ error: message }, { status });
}
