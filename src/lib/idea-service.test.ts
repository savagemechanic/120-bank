import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/errors";
import { MemoryIdeaStore } from "@/lib/idea-store";
import { createIdeaForActor, transitionIdeaForActor } from "@/lib/idea-service";
import type { Actor, IdeaCreateInput } from "@/lib/types";
import { parseIdeaSubmission } from "@/lib/validation";

const seigha: Actor = {
  role: "seigha_agent",
  type: "agent",
  name: "SEIGHA_AGENT"
};

const chibueze: Actor = {
  role: "chibueze_agent",
  type: "agent",
  name: "CHIBUEZE_AGENT"
};

const human: Actor = {
  role: "human",
  type: "human",
  name: "HUMAN_REVIEWER"
};

function validInput(idempotencyKey?: string): IdeaCreateInput {
  return {
    owner: "SEIGHA",
    submittedBy: "SEIGHA_AGENT",
    title: "The Receipt Test",
    concept: "A fast video concept about how one small receipt explains a whole month of spending.",
    storyboardBeats: ["Open on receipts", "Reveal the habit", "Close with a useful rule"],
    psychology: "Pattern interrupt and relief.",
    whyItCouldPerform: "The idea is specific, familiar, and save-worthy.",
    caption: "One tiny receipt can expose the month.",
    onScreenText: ["Which receipt hurt most?"],
    risks: ["Keep financial guidance general."],
    sources: ["Test fixture"],
    rawPayload: { fixture: true },
    idempotencyKey
  };
}

describe("idea validation and workflow", () => {
  it("rejects invalid POST idea payloads", () => {
    expect(() =>
      parseIdeaSubmission({
        title: "No",
        concept: "short",
        storyboardBeats: []
      })
    ).toThrow(ApiError);
  });

  it("uses idempotency keys to prevent duplicate submissions", async () => {
    const store = new MemoryIdeaStore();

    const first = await createIdeaForActor(store, seigha, validInput("same-idea-key"));
    const second = await createIdeaForActor(store, seigha, validInput("same-idea-key"));

    expect(first.reused).toBe(false);
    expect(second.reused).toBe(true);
    expect(second.idea.id).toBe(first.idea.id);
    expect(await store.countIdeas()).toBe(1);
  });

  it("prevents the SEIGHA agent from approving", async () => {
    const store = new MemoryIdeaStore();
    const created = await createIdeaForActor(store, seigha, validInput());

    await transitionIdeaForActor(store, chibueze, created.idea.id, "review");

    await expect(transitionIdeaForActor(store, seigha, created.idea.id, "approve")).rejects.toMatchObject({
      status: 403,
      code: "forbidden"
    });
  });

  it("allows CHIBUEZE to review but not approve", async () => {
    const store = new MemoryIdeaStore();
    const created = await createIdeaForActor(store, seigha, validInput());

    const reviewed = await transitionIdeaForActor(store, chibueze, created.idea.id, "review");

    expect(reviewed.status).toBe("reviewed");

    await expect(transitionIdeaForActor(store, chibueze, created.idea.id, "approve")).rejects.toMatchObject({
      status: 403,
      code: "forbidden"
    });
  });

  it("allows a human token actor to approve reviewed ideas", async () => {
    const store = new MemoryIdeaStore();
    const created = await createIdeaForActor(store, seigha, validInput());

    await transitionIdeaForActor(store, chibueze, created.idea.id, "review");
    const approved = await transitionIdeaForActor(store, human, created.idea.id, "approve");

    expect(approved.status).toBe("approved");
    expect(approved.approvedBy).toBe("HUMAN_REVIEWER");
    expect(approved.approvedAt).toBeTruthy();
  });

  it("rejects invalid status transitions", async () => {
    const store = new MemoryIdeaStore();
    const created = await createIdeaForActor(store, seigha, validInput());

    await expect(transitionIdeaForActor(store, human, created.idea.id, "approve")).rejects.toMatchObject({
      status: 409,
      code: "invalid_transition"
    });
  });
});
