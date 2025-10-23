/**
 * Utility functions to normalize API responses
 * Backend uses uppercase ID (from GORM), frontend uses lowercase id
 */

/**
 * Normalize a single object to have both id and ID fields
 */
export function normalizeId<T extends Record<string, any>>(obj: T): T {
  if (!obj) return obj;
  
  // If object has ID but not id, add id
  if ('ID' in obj && !('id' in obj)) {
    return { ...obj, id: obj.ID };
  }
  
  // If object has id but not ID, add ID
  if ('id' in obj && !('ID' in obj)) {
    return { ...obj, ID: obj.id };
  }
  
  return obj;
}

/**
 * Normalize an array of objects to have both id and ID fields
 */
export function normalizeIds<T extends Record<string, any>>(arr: T[]): T[] {
  if (!Array.isArray(arr)) return arr;
  return arr.map(normalizeId);
}

/**
 * Recursively normalize all id/ID fields in an object
 */
export function deepNormalizeIds<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => deepNormalizeIds(item)) as any;
  }
  
  // Normalize current level
  let normalized = normalizeId(obj);
  
  // Recursively normalize nested objects
  for (const key in normalized) {
    if (normalized[key] && typeof normalized[key] === 'object') {
      normalized[key] = deepNormalizeIds(normalized[key]);
    }
  }
  
  return normalized;
}

/**
 * Get the ID value regardless of case
 */
export function getId(obj: any): number | undefined {
  if (!obj) return undefined;
  return obj.id || obj.ID;
}

/**
 * Normalize user object (common pattern)
 */
export function normalizeUser(user: any) {
  if (!user) return user;
  return {
    ...user,
    id: user.id || user.ID,
    ID: user.ID || user.id
  };
}

/**
 * Normalize users array
 */
export function normalizeUsers(users: any[]) {
  if (!Array.isArray(users)) return users;
  return users.map(normalizeUser);
}
