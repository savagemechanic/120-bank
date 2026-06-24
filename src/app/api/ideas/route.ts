import { handleCreateIdea, handleListIdeas } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return handleListIdeas(request);
}

export async function POST(request: Request) {
  return handleCreateIdea(request);
}
