import fs from 'node:fs';
import path from 'path';

const CACHE_FILE = path.resolve(process.cwd(), 'node_modules/.cache/route-gen.json');

export interface FileCache {
  files: string;
  lastRoutesHash: string | null;
}

/**
 * Load cache from disk
 */
export function loadCache(): FileCache {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, 'utf8');
      return JSON.parse(data) as FileCache;
    }
  } catch {
    // Ignore cache read errors
  }
  return { files: '{}', lastRoutesHash: null };
}

/**
 * Save cache to disk
 */
export function saveCache(cache: FileCache): void {
  const cacheDir = path.dirname(CACHE_FILE);
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
}
