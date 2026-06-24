import { ApiError } from "@/lib/errors";
import type { Actor, ActorRole } from "@/lib/types";

function bearerToken(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

function matchesSecret(provided: string | null, expected?: string) {
  return Boolean(provided && expected && provided === expected);
}

function actorName(request: Request, fallback: string) {
  const value = request.headers.get("x-actor-name")?.trim();
  return value || fallback;
}

export function authenticateRequest(request: Request): Actor {
  const url = new URL(request.url);
  const apiKey = request.headers.get("x-api-key") ?? bearerToken(request);
  const reviewToken =
    request.headers.get("x-review-token") ??
    request.headers.get("x-human-review-token") ??
    url.searchParams.get("token");

  if (matchesSecret(apiKey, process.env.SEIGHA_AGENT_API_KEY)) {
    return {
      role: "seigha_agent",
      type: "agent",
      name: actorName(request, "SEIGHA_AGENT")
    };
  }

  if (matchesSecret(apiKey, process.env.CHIBUEZE_AGENT_API_KEY)) {
    return {
      role: "chibueze_agent",
      type: "agent",
      name: actorName(request, "CHIBUEZE_AGENT")
    };
  }

  if (matchesSecret(reviewToken, process.env.HUMAN_REVIEW_TOKEN)) {
    return {
      role: "human",
      type: "human",
      name: actorName(request, "HUMAN_REVIEWER")
    };
  }

  throw new ApiError(401, "unauthorized", "A valid API key or human review token is required.");
}

export function requireRole(actor: Actor, allowed: ActorRole[]) {
  if (!allowed.includes(actor.role)) {
    throw new ApiError(403, "forbidden", "This credential is not allowed to perform that action.");
  }
}
