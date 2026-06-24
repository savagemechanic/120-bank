import { NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth";
import { handleApiError, readJsonBody } from "@/lib/errors";
import {
  createIdeaForActor,
  defaultIdeaStore,
  getIdeaForActor,
  listIdeasForActor,
  transitionIdeaForActor
} from "@/lib/idea-service";
import type { TransitionAction } from "@/lib/types";
import { parseIdeaSubmission, parseListFilters, parseTransitionBody } from "@/lib/validation";

export async function handleListIdeas(request: Request) {
  try {
    const actor = authenticateRequest(request);
    const filters = parseListFilters(new URL(request.url).searchParams);
    const result = await listIdeasForActor(defaultIdeaStore, actor, filters);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function handleCreateIdea(request: Request) {
  try {
    const actor = authenticateRequest(request);
    const body = await readJsonBody(request);
    const idempotencyKey = request.headers.get("idempotency-key");
    const input = parseIdeaSubmission(body, idempotencyKey);
    const result = await createIdeaForActor(defaultIdeaStore, actor, input);

    return NextResponse.json(result, {
      status: result.reused ? 200 : 201
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function handleGetIdea(request: Request, id: string) {
  try {
    const actor = authenticateRequest(request);
    const idea = await getIdeaForActor(defaultIdeaStore, actor, id);
    return NextResponse.json({ idea });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function handleTransition(request: Request, id: string, action: TransitionAction) {
  try {
    const actor = authenticateRequest(request);
    const body = await readJsonBody(request);
    const transitionBody = parseTransitionBody(body);
    const idea = await transitionIdeaForActor(defaultIdeaStore, actor, id, action, transitionBody.note);
    return NextResponse.json({ idea });
  } catch (error) {
    return handleApiError(error);
  }
}
