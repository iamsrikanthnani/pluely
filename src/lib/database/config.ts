import Database from "@tauri-apps/plugin-sql";

/**
 * Database configuration
 */
export const DB_NAME = "sqlite:nluely.db";

let dbInstance: Database | null = null;

/**
 * Get database instance
 */
export async function getDatabase(): Promise<Database> {
  if (!dbInstance) {
    try {
      dbInstance = await Database.load(DB_NAME);
    } catch (error) {
      throw new Error(
        `Failed to initialize database: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
  return dbInstance;
}
