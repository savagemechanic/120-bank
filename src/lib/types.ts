export const IDEA_STATUSES = [
  "pending_review",
  "reviewed",
  "approved",
  "flagged",
  "discarded"
] as const;

export type IdeaStatus = (typeof IDEA_STATUSES)[number];

export type ActorRole = "seigha_agent" | "chibueze_agent" | "human";
export type ActorType = "agent" | "human";

export interface Actor {
  role: ActorRole;
  type: ActorType;
  name: string;
}

export interface Idea {
  id: string;
  owner: "SEIGHA";
  submittedBy: string;
  status: IdeaStatus;
  title: string;
  concept: string;
  storyboardBeats: unknown[];
  psychology: string;
  whyItCouldPerform: string;
  caption: string;
  onScreenText: unknown[];
  risks: unknown[];
  sources: unknown[];
  rawPayload: Record<string, unknown>;
  reviewedBy: string | null;
  reviewedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  events?: IdeaEvent[];
}

export interface IdeaEvent {
  id: string;
  ideaId: string;
  action: string;
  actorType: ActorType;
  actorName: string;
  fromStatus: IdeaStatus | null;
  toStatus: IdeaStatus | null;
  note: string | null;
  createdAt: string;
}

export interface IdeaCreateInput {
  owner: "SEIGHA";
  submittedBy: string;
  title: string;
  concept: string;
  storyboardBeats: unknown[];
  psychology: string;
  whyItCouldPerform: string;
  caption: string;
  onScreenText: unknown[];
  risks: unknown[];
  sources: unknown[];
  rawPayload: Record<string, unknown>;
  idempotencyKey?: string;
}

export interface ListFilters {
  status?: IdeaStatus;
  owner?: "SEIGHA";
  limit: number;
  cursor?: string;
}

export interface ListResult {
  items: Idea[];
  nextCursor: string | null;
}

export type TransitionAction = "review" | "approve" | "flag" | "discard";

export interface TransitionInput {
  id: string;
  action: TransitionAction;
  actor: Actor;
  fromStatus: IdeaStatus;
  toStatus: IdeaStatus;
  note?: string;
}
