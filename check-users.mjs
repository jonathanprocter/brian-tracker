import { drizzle } from "drizzle-orm/mysql2";

const db = drizzle(process.env.DATABASE_URL);
const result = await db.execute("SELECT id, openId, name, role FROM users");
console.log("Users:", JSON.stringify(result[0], null, 2));
process.exit(0);
