import postgres from "postgres";

type SqlClient = ReturnType<typeof postgres>;

declare global {
  var __oneTwentyBankSql: SqlClient | undefined;
}

export function getSql() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!globalThis.__oneTwentyBankSql) {
    globalThis.__oneTwentyBankSql = postgres(databaseUrl, {
      max: 10,
      prepare: false
    });
  }

  return globalThis.__oneTwentyBankSql;
}

export async function pingDatabase() {
  const sql = getSql();
  await sql`SELECT 1`;
}
