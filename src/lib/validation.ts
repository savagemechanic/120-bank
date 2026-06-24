import { z } from "zod";

import { ApiError } from "@/lib/errors";
import { IDEA_STATUSES, type IdeaCreateInput, type ListFilters } from "@/lib/types";

const listItemSchema = z.union([z.string(), z.record(z.unknown())]);

const ideaSubmissionSchema = z
  .object({
    submittedBy: z.string().trim().min(1).max(120).optional(),
    title: z.string().trim().min(3).max(180),
    concept: z.string().trim().min(10).max(4000),
    storyboardBeats: z.array(listItemSchema).min(1).max(30),
    psychology: z.string().trim().max(3000).optional().default(""),
    whyItCouldPerform: z.string().trim().max(3000).optional().default(""),
    caption: z.string().trim().max(2200).optional().default(""),
    onScreenText: z.array(listItemSchema).max(50).optional().default([]),
    risks: z.array(listItemSchema).max(50).optional().default([]),
    sources: z.array(listItemSchema).max(50).optional().default([])
  })
  .passthrough();

const transitionBodySchema = z
  .object({
    note: z.string().trim().max(1000).optional()
  })
  .passthrough();

const listFiltersSchema = z.object({
  status: z.enum(IDEA_STATUSES).optional(),
  owner: z.literal("SEIGHA").optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().trim().min(1).optional()
});

function zodDetails(error: z.ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message
  }));
}

export function parseIdeaSubmission(body: unknown, idempotencyKey?: string | null): IdeaCreateInput {
  const parsed = ideaSubmissionSchema.safeParse(body);

  if (!parsed.success) {
    throw new ApiError(422, "validation_failed", "Idea submission is invalid.", zodDetails(parsed.error));
  }

  return {
    owner: "SEIGHA",
    submittedBy: parsed.data.submittedBy ?? "SEIGHA_AGENT",
    title: parsed.data.title,
    concept: parsed.data.concept,
    storyboardBeats: parsed.data.storyboardBeats,
    psychology: parsed.data.psychology,
    whyItCouldPerform: parsed.data.whyItCouldPerform,
    caption: parsed.data.caption,
    onScreenText: parsed.data.onScreenText,
    risks: parsed.data.risks,
    sources: parsed.data.sources,
    rawPayload: (body && typeof body === "object" ? body : {}) as Record<string, unknown>,
    idempotencyKey: idempotencyKey?.trim() || undefined
  };
}

export function parseTransitionBody(body: unknown) {
  const parsed = transitionBodySchema.safeParse(body);

  if (!parsed.success) {
    throw new ApiError(422, "validation_failed", "Transition body is invalid.", zodDetails(parsed.error));
  }

  return parsed.data;
}

export function parseListFilters(searchParams: URLSearchParams): ListFilters {
  const parsed = listFiltersSchema.safeParse({
    status: searchParams.get("status") || undefined,
    owner: searchParams.get("owner") || undefined,
    limit: searchParams.get("limit") || undefined,
    cursor: searchParams.get("cursor") || undefined
  });

  if (!parsed.success) {
    throw new ApiError(422, "validation_failed", "List filters are invalid.", zodDetails(parsed.error));
  }

  return parsed.data;
}
