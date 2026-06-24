import { requireRole } from "@/lib/auth";
import { ApiError } from "@/lib/errors";
import { DbIdeaStore } from "@/lib/db-idea-store";
import type { IdeaStore } from "@/lib/idea-store";
import type {
  Actor,
  IdeaCreateInput,
  IdeaStatus,
  ListFilters,
  TransitionAction
} from "@/lib/types";

export const defaultIdeaStore = new DbIdeaStore();

export async function createIdeaForActor(store: IdeaStore, actor: Actor, input: IdeaCreateInput) {
  requireRole(actor, ["seigha_agent"]);
  return store.createIdea(
    {
      ...input,
      owner: "SEIGHA"
    },
    actor
  );
}

export async function listIdeasForActor(store: IdeaStore, actor: Actor, filters: ListFilters) {
  if (actor.role === "seigha_agent") {
    throw new ApiError(403, "forbidden", "SEIGHA agent credentials can only submit ideas.");
  }

  const enforcedFilters = { ...filters };

  if (actor.role === "chibueze_agent") {
    if (filters.status && filters.status !== "pending_review") {
      throw new ApiError(403, "forbidden", "CHIBUEZE agent credentials can only list pending ideas.");
    }

    enforcedFilters.status = "pending_review";
  }

  return store.listIdeas(enforcedFilters);
}

export async function getIdeaForActor(store: IdeaStore, actor: Actor, id: string) {
  if (actor.role === "seigha_agent") {
    throw new ApiError(403, "forbidden", "SEIGHA agent credentials can only submit ideas.");
  }

  const idea = await store.getIdea(id, true);

  if (!idea) {
    throw new ApiError(404, "not_found", "Idea not found.");
  }

  if (actor.role === "chibueze_agent" && idea.status !== "pending_review") {
    throw new ApiError(403, "forbidden", "CHIBUEZE agent credentials can only read pending ideas.");
  }

  return idea;
}

function transitionTarget(action: TransitionAction): IdeaStatus {
  switch (action) {
    case "review":
      return "reviewed";
    case "approve":
      return "approved";
    case "flag":
      return "flagged";
    case "discard":
      return "discarded";
  }
}

function assertTransitionAllowed(actor: Actor, action: TransitionAction, fromStatus: IdeaStatus) {
  if (action === "review") {
    requireRole(actor, ["chibueze_agent"]);

    if (fromStatus !== "pending_review") {
      throw new ApiError(409, "invalid_transition", "Only pending ideas can be marked reviewed.");
    }

    return;
  }

  if (action === "approve") {
    requireRole(actor, ["human"]);

    if (fromStatus !== "reviewed") {
      throw new ApiError(409, "invalid_transition", "Only reviewed ideas can be approved.");
    }

    return;
  }

  if (action === "flag") {
    requireRole(actor, ["chibueze_agent", "human"]);

    if (actor.role === "chibueze_agent" && fromStatus !== "pending_review") {
      throw new ApiError(409, "invalid_transition", "CHIBUEZE can only flag pending ideas.");
    }

    if (!["pending_review", "reviewed", "approved"].includes(fromStatus)) {
      throw new ApiError(409, "invalid_transition", "Only active ideas can be flagged.");
    }

    return;
  }

  if (action === "discard") {
    requireRole(actor, ["human"]);

    if (!["pending_review", "reviewed", "approved", "flagged"].includes(fromStatus)) {
      throw new ApiError(409, "invalid_transition", "Idea cannot be discarded from its current status.");
    }
  }
}

export async function transitionIdeaForActor(
  store: IdeaStore,
  actor: Actor,
  id: string,
  action: TransitionAction,
  note?: string
) {
  const idea = await store.getIdea(id);

  if (!idea) {
    throw new ApiError(404, "not_found", "Idea not found.");
  }

  assertTransitionAllowed(actor, action, idea.status);

  return store.transitionIdea({
    id,
    action,
    actor,
    fromStatus: idea.status,
    toStatus: transitionTarget(action),
    note
  });
}
