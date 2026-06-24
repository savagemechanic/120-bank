import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required to seed data.");
  process.exit(1);
}

const sql = postgres(databaseUrl, { max: 1, prepare: false });

const ideas = [
  {
    key: "seed-seigha-001",
    title: "The Receipt Test",
    concept:
      "A creator flashes three fake receipts and reveals the spending habit nobody admits before payday.",
    storyboardBeats: [
      "Open with three receipts slapped on a table.",
      "Zoom into the smallest purchase that triggered the biggest regret.",
      "Cut to a practical 10-second rule for avoiding the same mistake."
    ],
    psychology: "Pattern interrupt, confession, then relief through a simple rule.",
    whyItCouldPerform:
      "It gives viewers a familiar money shame moment and a save-worthy takeaway.",
    caption: "One tiny receipt can expose the whole month.",
    onScreenText: ["Which receipt hurt most?", "The 10-second rule"],
    risks: ["Financial advice must stay general."],
    sources: ["Seed sample"]
  },
  {
    key: "seed-seigha-002",
    title: "Inbox Before Coffee",
    concept:
      "A split-screen routine shows how opening email first steals the first useful hour of the day.",
    storyboardBeats: [
      "Left side opens email in bed, right side writes one priority.",
      "Timer shows the email side losing 47 minutes.",
      "End on a clean two-step morning reset."
    ],
    psychology: "Contrast effect and identity-based productivity.",
    whyItCouldPerform:
      "The side-by-side format makes the cost of a common habit instantly visible.",
    caption: "Your first tap decides the whole morning.",
    onScreenText: ["Email first", "Priority first", "47 minutes gone"],
    risks: [],
    sources: ["Seed sample"]
  }
];

try {
  for (const idea of ideas) {
    await sql`
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
        'SEIGHA_AGENT',
        'pending_review',
        ${idea.title},
        ${idea.concept},
        ${sql.json(idea.storyboardBeats)},
        ${idea.psychology},
        ${idea.whyItCouldPerform},
        ${idea.caption},
        ${sql.json(idea.onScreenText)},
        ${sql.json(idea.risks)},
        ${sql.json(idea.sources)},
        ${sql.json(idea)},
        ${idea.key}
      )
      ON CONFLICT (idempotency_key) DO NOTHING
    `;
  }

  await sql`
    INSERT INTO idea_events (idea_id, action, actor_type, actor_name, to_status, note)
    SELECT id, 'created', 'agent', 'SEIGHA_AGENT', status, 'Seed data'
    FROM ideas
    WHERE idempotency_key IN ('seed-seigha-001', 'seed-seigha-002')
      AND NOT EXISTS (
        SELECT 1 FROM idea_events
        WHERE idea_events.idea_id = ideas.id AND action = 'created'
      )
  `;

  console.log("Seed data ready.");
} finally {
  await sql.end();
}
