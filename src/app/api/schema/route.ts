import { NextResponse } from "next/server";

import { IDEA_STATUSES } from "@/lib/types";

export async function GET() {
  return NextResponse.json({
    service: "120-bank",
    statuses: IDEA_STATUSES,
    auth: {
      seighaAgent: {
        secret: "SEIGHA_AGENT_API_KEY",
        allowed: ["POST /api/ideas"]
      },
      chibuezeAgent: {
        secret: "CHIBUEZE_AGENT_API_KEY",
        allowed: [
          "GET /api/ideas?status=pending_review",
          "GET /api/ideas/:id for pending ideas",
          "PATCH /api/ideas/:id/review",
          "PATCH /api/ideas/:id/flag for pending ideas"
        ]
      },
      human: {
        secret: "HUMAN_REVIEW_TOKEN",
        allowed: [
          "GET /api/ideas",
          "GET /api/ideas/:id",
          "PATCH /api/ideas/:id/approve",
          "PATCH /api/ideas/:id/flag",
          "PATCH /api/ideas/:id/discard"
        ]
      }
    },
    ideaFields: [
      "id",
      "owner",
      "submittedBy",
      "status",
      "title",
      "concept",
      "storyboardBeats",
      "psychology",
      "whyItCouldPerform",
      "caption",
      "onScreenText",
      "risks",
      "sources",
      "rawPayload",
      "reviewedBy",
      "reviewedAt",
      "approvedBy",
      "approvedAt",
      "createdAt",
      "updatedAt"
    ],
    auditFields: [
      "id",
      "ideaId",
      "action",
      "actorType",
      "actorName",
      "fromStatus",
      "toStatus",
      "note",
      "createdAt"
    ]
  });
}
