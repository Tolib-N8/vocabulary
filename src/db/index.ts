import * as SQLite from 'expo-sqlite';
import { SCHEMA_SQL } from './schema';
import { seedBuiltinDecks } from './seed';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('vocabulary.db');
      await db.execAsync(SCHEMA_SQL);
      await seedBuiltinDecks(db);
      return db;
    })();
  }
  return dbPromise;
}
