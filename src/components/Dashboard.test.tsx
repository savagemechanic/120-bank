import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Dashboard } from "@/components/Dashboard";
import type { Idea } from "@/lib/types";

const idea: Idea = {
  id: "5d7f4182-a759-4450-a266-4f7eab5f59bd",
  owner: "SEIGHA",
  submittedBy: "SEIGHA_AGENT",
  status: "pending_review",
  title: "The Receipt Test",
  concept: "A fast video concept about how one small receipt explains a whole month of spending.",
  storyboardBeats: ["Open on receipts", "Reveal the habit"],
  psychology: "Pattern interrupt.",
  whyItCouldPerform: "It is familiar and specific.",
  caption: "One tiny receipt can expose the month.",
  onScreenText: ["Which receipt hurt most?"],
  risks: ["Keep advice general."],
  sources: ["Fixture"],
  rawPayload: {},
  reviewedBy: null,
  reviewedAt: null,
  approvedBy: null,
  approvedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  events: [
    {
      id: "event-1",
      ideaId: "5d7f4182-a759-4450-a266-4f7eab5f59bd",
      action: "created",
      actorType: "agent",
      actorName: "SEIGHA_AGENT",
      fromStatus: null,
      toStatus: "pending_review",
      note: "Idea submitted",
      createdAt: new Date().toISOString()
    }
  ]
};

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe("Dashboard", () => {
  it("renders the review board with fetched ideas", async () => {
    const ideas = Array.from({ length: 5 }, (_, index) => ({
      ...idea,
      id: `${idea.id}-${index}`,
      title: index === 0 ? idea.title : `${idea.title} ${index + 1}`
    }));
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        items: ideas,
        nextCursor: null
      })
    }));

    vi.stubGlobal("fetch", fetchMock);

    render(<Dashboard initialToken="human-token" />);

    expect(await screen.findByText("The Receipt Test")).toBeInTheDocument();
    expect(screen.getByText("120 Bank")).toBeInTheDocument();
    expect(screen.getAllByText("Pending Review").length).toBeGreaterThan(0);
    expect(screen.getByTestId("pipeline-list-pending_review")).toHaveClass("max-h-[47.75rem]", "overflow-y-auto");
  });
});
