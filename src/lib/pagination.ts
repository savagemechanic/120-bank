import { ApiError } from "@/lib/errors";
import type { Idea } from "@/lib/types";

interface CursorPayload {
  createdAt: string;
  id: string;
}

export function encodeCursor(idea: Idea) {
  const payload: CursorPayload = {
    createdAt: idea.createdAt,
    id: idea.id
  };

  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export function decodeCursor(cursor: string): CursorPayload {
  try {
    const value = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as CursorPayload;

    if (!value.createdAt || !value.id) {
      throw new Error("missing cursor fields");
    }

    return value;
  } catch {
    throw new ApiError(422, "invalid_cursor", "Cursor is invalid.");
  }
}
