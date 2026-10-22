import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';
import { withDbRetry } from './retry.ts';

export async function getOrCreateUser(
  uid: string,
  email: string,
  name?: string,
  role?: string,
  department?: string
) {
  try {
    return await withDbRetry(async () => {
      const result = await db
        .insert(users)
        .values({
          uid,
          email,
          name: name || email.split('@')[0],
          role: role || 'Staff',
          department: department || '',
        })
        .onConflictDoUpdate({
          target: users.uid,
          set: {
            email,
            ...(name ? { name } : {}),
            ...(department ? { department } : {}),
          },
        })
        .returning();

      return result[0];
    });
  } catch (error) {
    console.error('Database query failed in getOrCreateUser:', error);
    throw new Error('Database operation failed while finding or registering user.', { cause: error });
  }
}

export async function getUsers() {
  try {
    return await withDbRetry(() => db.select().from(users));
  } catch (error) {
    console.error('Database query failed in getUsers:', error);
    throw new Error('Database query failed while fetching users.', { cause: error });
  }
}

export async function updateUser(uid: string, updates: Partial<typeof users.$inferInsert>) {
  try {
    return await withDbRetry(async () => {
      const result = await db
        .update(users)
        .set(updates)
        .where(eq(users.uid, uid))
        .returning();
      return result[0] || null;
    });
  } catch (error) {
    console.error('Database query failed in updateUser:', error);
    throw new Error('Database operation failed while updating user.', { cause: error });
  }
}
