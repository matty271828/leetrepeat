import { openDB } from 'idb';
import type { DBSchema } from 'idb';
import type { Problem } from '../types/Problem';

interface LeetRepeatDB extends DBSchema {
  problems: {
    key: number;
    value: Problem;
    indexes: { 'by-nextDue': number };
  };
}

const DB_NAME = 'leetrepeat-db';
const DB_VERSION = 1;

export const dbPromise = openDB<LeetRepeatDB>(DB_NAME, DB_VERSION, {
  upgrade(db) {
    const store = db.createObjectStore('problems', {
      keyPath: 'id',
      autoIncrement: true,
    });
    store.createIndex('by-nextDue', 'nextDue');
  },
});

export async function addProblem(problem: Omit<Problem, 'id'>) {
  const db = await dbPromise;
  return db.add('problems', problem);
}

export async function getProblemsDue(now: number): Promise<Problem[]> {
  const db = await dbPromise;
  return (await db.getAllFromIndex('problems', 'by-nextDue', IDBKeyRange.upperBound(now))) || [];
}

export async function getUpcomingProblems(now: number): Promise<Problem[]> {
  const db = await dbPromise;
  return (await db.getAllFromIndex('problems', 'by-nextDue', IDBKeyRange.lowerBound(now, true))) || [];
}

export async function getAllProblems(): Promise<Problem[]> {
  const db = await dbPromise;
  return (await db.getAll('problems')) || [];
}

export async function updateProblem(problem: Problem) {
  const db = await dbPromise;
  return db.put('problems', problem);
}

export async function deleteProblem(id: number) {
  const db = await dbPromise;
  return db.delete('problems', id);
} 