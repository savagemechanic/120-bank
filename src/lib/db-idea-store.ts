import type postgres from "postgres";

import { getSql } from "@/lib/db";
import { ApiError } from "@/lib/errors";
import type { IdeaStore } from "@/lib/idea-store";
import { decodeCursor, encodeCursor } from "@/lib/pagination";
import type {
  Actor,
  Idea,
  IdeaCreateInput,
  IdeaEvent,
  ListFilters,
  TransitionInput
} from "@/lib/types";

interface IdeaRow {
  id: string;
  owner: "SEIGHA";
  submitted_by: string;
  status: Idea["status"];
  title: string;
  concept: string;
  storyboard_beats: unknown[];
  psychology: string;
  why_it_could_perform: string;
  caption: string;
  on_screen_text: unknown[];
  risks: unknown[];
  sources: unknown[];
  raw_payload: Record<string, unknown>;
  reviewed_by: string | null;
  reviewed_at: Date | string | null;
  approved_by: string | null;
  approved_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
  created_now?: boolean;
}

interface IdeaEventRow {
  id: string;
  idea_id: string;
  action: string;
  actor_type: IdeaEvent["actorType"];
  actor_name: string;
  from_status: IdeaEvent["fromStatus"];
  to_status: IdeaEvent["toStatus"];
  note: string | null;
  created_at: Date | string;
}

function toJson(value: unknown): postgres.JSONValue {
  return value as postgres.JSONValue;
}

function iso(value: Date | string | null) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapIdea(row: IdeaRow): Idea {
  return {
    id: row.id,
    owner: row.owner,
    submittedBy: row.submitted_by,
    status: row.status,
    title: row.title,
    concept: row.concept,
    storyboardBeats: row.storyboard_beats ?? [],
    psychology: row.psychology,
    whyItCouldPerform: row.why_it_could_perform,
    caption: row.caption,
    onScreenText: row.on_screen_text ?? [],
    risks: row.risks ?? [],
    sources: row.sources ?? [],
    rawPayload: row.raw_payload ?? {},
    reviewedBy: row.reviewed_by,
    reviewedAt: iso(row.reviewed_at),
    approvedBy: row.approved_by,
    approvedAt: iso(row.approved_at),
    createdAt: iso(row.created_at) ?? new Date().toISOString(),
    updatedAt: iso(row.updated_at) ?? new Date().toISOString()
  };
}

function mapEvent(row: IdeaEventRow): IdeaEvent {
  return {
    id: row.id,
    ideaId: row.idea_id,
    action: row.action,
    actorType: row.actor_type,
    actorName: row.actor_name,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    note: row.note,
    createdAt: iso(row.created_at) ?? new Date().toISOString()
  };
}

export class DbIdeaStore implements IdeaStore {
  async createIdea(input: IdeaCreateInput, actor: Actor) {
    const sql = getSql();

    return sql.begin(async (tx) => {
      const rows = input.idempotencyKey
        ? await tx<IdeaRow[]>`
            WITH inserted AS (
              INSERT INTO ideas (
                owner,
                submitted_by,
                status,
                title,
                concept,
                storyboard_beats,
                psychology,
                why_it_could_perform,
                caption,
                on_screen_text,
                risks,
                sources,
                raw_payload,
                idempotency_key
              ) VALUES (
                'SEIGHA',
                ${input.submittedBy},
                'pending_review',
                ${input.title},
                ${input.concept},
                ${tx.json(toJson(input.storyboardBeats))},
                ${input.psychology},
                ${input.whyItCouldPerform},
                ${input.caption},
                ${tx.json(toJson(input.onScreenText))},
                ${tx.json(toJson(input.risks))},
                ${tx.json(toJson(input.sources))},
                ${tx.json(toJson(input.rawPayload))},
                ${input.idempotencyKey}
              )
              ON CONFLICT (idempotency_key) DO NOTHING
              RETURNING *, true AS created_now
            )
            SELECT * FROM inserted
            UNION ALL
            SELECT ideas.*, false AS created_now
            FROM ideas
            WHERE idempotency_key = ${input.idempotencyKey}
            LIMIT 1
          `
        : await tx<IdeaRow[]>`
            INSERT INTO ideas (
              owner,
              submitted_by,
              status,
              title,
              concept,
              storyboard_beats,
              psychology,
              why_it_could_perform,
              caption,
              on_screen_text,
              risks,
              sources,
              raw_payload,
              idempotency_key
            ) VALUES (
              'SEIGHA',
              ${input.submittedBy},
              'pending_review',
              ${input.title},
              ${input.concept},
              ${tx.json(toJson(input.storyboardBeats))},
              ${input.psychology},
              ${input.whyItCouldPerform},
              ${input.caption},
              ${tx.json(toJson(input.onScreenText))},
              ${tx.json(toJson(input.risks))},
              ${tx.json(toJson(input.sources))},
              ${tx.json(toJson(input.rawPayload))},
              NULL
            )
            RETURNING *, true AS created_now
          `;

      const row = rows[0];

      if (!row) {
        throw new ApiError(500, "create_failed", "Idea could not be created.");
      }

      if (row.created_now) {
        await tx`
          INSERT INTO idea_events (
            idea_id,
            action,
            actor_type,
            actor_name,
            from_status,
            to_status,
            note
          ) VALUES (
            ${row.id},
            'created',
            ${actor.type},
            ${actor.name},
            NULL,
            'pending_review',
            'Idea submitted'
          )
        `;
      }

      return {
        idea: mapIdea(row),
        reused: !row.created_now
      };
    });
  }

  async listIdeas(filters: ListFilters) {
    const sql = getSql();
    const cursor = filters.cursor ? decodeCursor(filters.cursor) : null;
    const clauses = [];

    if (filters.status) {
      clauses.push(sql`status = ${filters.status}::idea_status`);
    }

    if (filters.owner) {
      clauses.push(sql`owner = ${filters.owner}`);
    }

    if (cursor) {
      clauses.push(sql`
        (
          created_at < ${cursor.createdAt}::timestamptz
          OR (created_at = ${cursor.createdAt}::timestamptz AND id < ${cursor.id}::uuid)
        )
      `);
    }

    const whereClause =
      clauses.length > 0
        ? sql`WHERE ${clauses.reduce((previous, clause) => sql`${previous} AND ${clause}`)}`
        : sql``;

    const rows = await sql<IdeaRow[]>`
      SELECT *
      FROM ideas
      ${whereClause}
      ORDER BY created_at DESC, id DESC
      LIMIT ${filters.limit + 1}
    `;

    const page = rows.map(mapIdea);
    const hasMore = page.length > filters.limit;
    const items = hasMore ? page.slice(0, filters.limit) : page;

    return {
      items,
      nextCursor: hasMore ? encodeCursor(items[items.length - 1]) : null
    };
  }

  async getIdea(id: string, includeEvents = false) {
    const sql = getSql();
    const rows = await sql<IdeaRow[]>`
      SELECT *
      FROM ideas
      WHERE id = ${id}::uuid
      LIMIT 1
    `;

    if (!rows[0]) {
      return null;
    }

    const idea = mapIdea(rows[0]);

    if (!includeEvents) {
      return idea;
    }

    const eventRows = await sql<IdeaEventRow[]>`
      SELECT *
      FROM idea_events
      WHERE idea_id = ${id}::uuid
      ORDER BY created_at DESC, id DESC
    `;

    return {
      ...idea,
      events: eventRows.map(mapEvent)
    };
  }

  async transitionIdea(input: TransitionInput) {
    const sql = getSql();

    return sql.begin(async (tx) => {
      const rows = await tx<IdeaRow[]>`
        UPDATE ideas
        SET
          status = ${input.toStatus}::idea_status,
          reviewed_by = CASE WHEN ${input.toStatus === "reviewed"} THEN ${input.actor.name} ELSE reviewed_by END,
          reviewed_at = CASE WHEN ${input.toStatus === "reviewed"} THEN now() ELSE reviewed_at END,
          approved_by = CASE WHEN ${input.toStatus === "approved"} THEN ${input.actor.name} ELSE approved_by END,
          approved_at = CASE WHEN ${input.toStatus === "approved"} THEN now() ELSE approved_at END
        WHERE id = ${input.id}::uuid
          AND status = ${input.fromStatus}::idea_status
        RETURNING *
      `;

      const row = rows[0];

      if (!row) {
        throw new ApiError(409, "transition_conflict", "Idea status changed before transition could be saved.");
      }

      await tx`
        INSERT INTO idea_events (
          idea_id,
          action,
          actor_type,
          actor_name,
          from_status,
          to_status,
          note
        ) VALUES (
          ${input.id}::uuid,
          ${input.action},
          ${input.actor.type},
          ${input.actor.name},
          ${input.fromStatus}::idea_status,
          ${input.toStatus}::idea_status,
          ${input.note ?? null}
        )
      `;

      return mapIdea(row);
    });
  }

  async countIdeas() {
    const sql = getSql();
    const [row] = await sql<{ count: string }[]>`SELECT count(*)::text AS count FROM ideas`;
    return Number(row?.count ?? 0);
  }
}
