import { encodeCursor, decodeCursor } from "@/lib/pagination";
import type {
  Actor,
  Idea,
  IdeaCreateInput,
  IdeaEvent,
  ListFilters,
  ListResult,
  TransitionInput
} from "@/lib/types";

export interface IdeaStore {
  createIdea(input: IdeaCreateInput, actor: Actor): Promise<{ idea: Idea; reused: boolean }>;
  listIdeas(filters: ListFilters): Promise<ListResult>;
  getIdea(id: string, includeEvents?: boolean): Promise<Idea | null>;
  transitionIdea(input: TransitionInput): Promise<Idea>;
  countIdeas(): Promise<number>;
}

function now() {
  return new Date().toISOString();
}

function randomId() {
  return crypto.randomUUID();
}

export class MemoryIdeaStore implements IdeaStore {
  private ideas = new Map<string, Idea>();
  private events = new Map<string, IdeaEvent[]>();
  private idempotency = new Map<string, string>();

  async createIdea(input: IdeaCreateInput, actor: Actor) {
    if (input.idempotencyKey) {
      const existingId = this.idempotency.get(input.idempotencyKey);

      if (existingId) {
        const idea = this.ideas.get(existingId);

        if (idea) {
          return { idea, reused: true };
        }
      }
    }

    const timestamp = now();
    const idea: Idea = {
      id: randomId(),
      owner: "SEIGHA",
      submittedBy: input.submittedBy,
      status: "pending_review",
      title: input.title,
      concept: input.concept,
      storyboardBeats: input.storyboardBeats,
      psychology: input.psychology,
      whyItCouldPerform: input.whyItCouldPerform,
      caption: input.caption,
      onScreenText: input.onScreenText,
      risks: input.risks,
      sources: input.sources,
      rawPayload: input.rawPayload,
      reviewedBy: null,
      reviewedAt: null,
      approvedBy: null,
      approvedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    this.ideas.set(idea.id, idea);

    if (input.idempotencyKey) {
      this.idempotency.set(input.idempotencyKey, idea.id);
    }

    const event: IdeaEvent = {
      id: randomId(),
      ideaId: idea.id,
      action: "created",
      actorType: actor.type,
      actorName: actor.name,
      fromStatus: null,
      toStatus: idea.status,
      note: "Idea submitted",
      createdAt: timestamp
    };

    this.events.set(idea.id, [event]);

    return { idea, reused: false };
  }

  async listIdeas(filters: ListFilters) {
    const cursor = filters.cursor ? decodeCursor(filters.cursor) : null;
    let ideas = Array.from(this.ideas.values());

    if (filters.status) {
      ideas = ideas.filter((idea) => idea.status === filters.status);
    }

    if (filters.owner) {
      ideas = ideas.filter((idea) => idea.owner === filters.owner);
    }

    if (cursor) {
      ideas = ideas.filter((idea) => {
        if (idea.createdAt < cursor.createdAt) {
          return true;
        }

        return idea.createdAt === cursor.createdAt && idea.id < cursor.id;
      });
    }

    ideas.sort((a, b) => {
      if (a.createdAt === b.createdAt) {
        return b.id.localeCompare(a.id);
      }

      return b.createdAt.localeCompare(a.createdAt);
    });

    const page = ideas.slice(0, filters.limit + 1);
    const hasMore = page.length > filters.limit;
    const items = hasMore ? page.slice(0, filters.limit) : page;

    return {
      items,
      nextCursor: hasMore ? encodeCursor(items[items.length - 1]) : null
    };
  }

  async getIdea(id: string, includeEvents = false) {
    const idea = this.ideas.get(id);

    if (!idea) {
      return null;
    }

    if (!includeEvents) {
      return idea;
    }

    return {
      ...idea,
      events: [...(this.events.get(id) ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    };
  }

  async transitionIdea(input: TransitionInput) {
    const existing = this.ideas.get(input.id);

    if (!existing || existing.status !== input.fromStatus) {
      throw new Error("Idea status changed before transition could be saved.");
    }

    const timestamp = now();
    const idea: Idea = {
      ...existing,
      status: input.toStatus,
      reviewedBy: input.toStatus === "reviewed" ? input.actor.name : existing.reviewedBy,
      reviewedAt: input.toStatus === "reviewed" ? timestamp : existing.reviewedAt,
      approvedBy: input.toStatus === "approved" ? input.actor.name : existing.approvedBy,
      approvedAt: input.toStatus === "approved" ? timestamp : existing.approvedAt,
      updatedAt: timestamp
    };

    this.ideas.set(input.id, idea);

    const event: IdeaEvent = {
      id: randomId(),
      ideaId: idea.id,
      action: input.action,
      actorType: input.actor.type,
      actorName: input.actor.name,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      note: input.note ?? null,
      createdAt: timestamp
    };

    this.events.set(input.id, [...(this.events.get(input.id) ?? []), event]);

    return idea;
  }

  async countIdeas() {
    return this.ideas.size;
  }
}
