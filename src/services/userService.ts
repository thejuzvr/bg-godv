'use server';

import * as storage from "../../server/storage";

/**
 * Creates a new user in the database
 * NOTE: This function is deprecated. Use authService.register() instead.
 */
export async function createUser(userId: string, email: string, passwordHash: string): Promise<void> {
  try {
    // Check if user already exists
    const existing = await storage.getUserById(userId);
    if (existing) {
      console.log(`User ${userId} already exists in database`);
      return;
    }
    
    // Create user
    await storage.createUser(userId, email, passwordHash);
    console.log(`Created user ${userId} in database`);
  } catch (error) {
    console.error(`Error creating user ${userId}:`, error);
    throw error;
  }
}

/**
 * Updates user's last login timestamp
 */
export async function updateUserLogin(userId: string): Promise<void> {
  try {
    await storage.updateUserLastLogin(userId);
  } catch (error) {
    console.error(`Error updating login for user ${userId}:`, error);
  }
}
