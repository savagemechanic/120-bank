import fs from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required to run migrations.");
  process.exit(1);
}

const sql = postgres(databaseUrl, { max: 1, prepare: false });
const migrationsDir = path.join(process.cwd(), "migrations");

try {
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  const files = (await fs.readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const [{ exists }] = await sql`
      SELECT EXISTS(
        SELECT 1 FROM schema_migrations WHERE filename = ${file}
      ) AS exists
    `;

    if (exists) {
      console.log(`Skipping ${file}`);
      continue;
    }

    const migration = await fs.readFile(path.join(migrationsDir, file), "utf8");

    await sql.begin(async (tx) => {
      await tx.unsafe(migration);
      await tx`INSERT INTO schema_migrations (filename) VALUES (${file})`;
    });

    console.log(`Applied ${file}`);
  }
} finally {
  await sql.end();
}
