import { NextResponse } from "next/server";

export type ApiErrorBody = {
  ok: false;
  error: {
    code: string;
    message: string;
    details: Record<string, string>;
  };
};

export function apiError(
  code: string,
  message: string,
  status: number,
  details: Record<string, string> = {},
) {
  return NextResponse.json<ApiErrorBody>(
    {
      ok: false,
      error: {
        code,
        message,
        details,
      },
    },
    { status },
  );
}
