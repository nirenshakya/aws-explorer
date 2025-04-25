// Secure storage using Web Crypto API
export const secureStorage = {
  set: async (key: string, value: string) => {
    console.log(`[Storage] Setting value for key: ${key}`);
    try {
      if (typeof window === 'undefined') {
        console.log('[Storage] Running on server, skipping storage operation');
        return;
      }

      const encoder = new TextEncoder();
      const data = encoder.encode(value);
      
      // Generate a 256-bit key from the environment variable
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'default-key-32-bytes-long-123456'),
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );
      
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        keyMaterial,
        data
      );
      const encryptedArray = new Uint8Array(encryptedData);
      const combined = new Uint8Array(iv.length + encryptedArray.length);
      combined.set(iv);
      combined.set(encryptedArray, iv.length);
      localStorage.setItem(key, btoa(String.fromCharCode(...combined)));
      console.log(`[Storage] Successfully stored encrypted value for key: ${key}`);
    } catch (error) {
      console.error(`[Storage] Error storing value for key ${key}:`, error);
      throw error;
    }
  },
  get: async (key: string): Promise<string | null> => {
    console.log(`[Storage] Getting value for key: ${key}`);
    try {
      if (typeof window === 'undefined') {
        console.log('[Storage] Running on server, returning null');
        return null;
      }

      const stored = localStorage.getItem(key);
      if (!stored) {
        console.log(`[Storage] No value found for key: ${key}`);
        return null;
      }
      
      const decoder = new TextDecoder();
      const combined = new Uint8Array(
        atob(stored)
          .split('')
          .map(c => c.charCodeAt(0))
      );
      const iv = combined.slice(0, 12);
      const encryptedData = combined.slice(12);
      
      // Generate a 256-bit key from the environment variable
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'default-key-32-bytes-long-123456'),
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );
      
      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        keyMaterial,
        encryptedData
      );
      
      const result = decoder.decode(decryptedData);
      console.log(`[Storage] Successfully retrieved and decrypted value for key: ${key}`);
      return result;
    } catch (error) {
      console.error(`[Storage] Error retrieving value for key ${key}:`, error);
      return null;
    }
  },
  remove: (key: string) => {
    console.log(`[Storage] Removing value for key: ${key}`);
    if (typeof window === 'undefined') {
      console.log('[Storage] Running on server, skipping remove operation');
      return;
    }
    localStorage.removeItem(key);
    console.log(`[Storage] Successfully removed value for key: ${key}`);
  }
}; 