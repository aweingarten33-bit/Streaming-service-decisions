import { readFileSync } from "fs";
import { Client } from "pg";

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: bun run run-sql <path-to-sql-file>");
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error(
    "Set DATABASE_URL in your .env — the direct Postgres connection string from " +
      "Supabase (Project Settings -> Database -> Connection string -> URI).",
  );
  process.exit(1);
}

const sql = readFileSync(filePath, "utf-8");
const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function main() {
  await client.connect();
  try {
    await client.query(sql);
    console.log(`Ran ${filePath} successfully.`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("SQL file failed:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
