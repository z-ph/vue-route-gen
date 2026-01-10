import fs from 'node:fs';
import path from 'path';

const EXCLUDED_DIRS = new Set(['components', 'hooks', 'services', 'types', 'constants', 'utils']);

/**
 * Normalize path separators to forward slashes
 */
export function normalizePath(p: string): string {
  return p.split(path.sep).join('/');
}

/**
 * Get file hash based on modification time and size
 */
export function getFileHash(filePath: string): string {
  const stats = fs.statSync(filePath);
  return `${stats.mtimeMs}-${stats.size}`;
}

/**
 * Build hash object for all Vue files in pages directory
 */
export function buildFileHash(pagesDir: string): string {
  const files = scanVueFiles(pagesDir);
  const hashObj: Record<string, string> = {};
  for (const file of files) {
    hashObj[normalizePath(path.relative(pagesDir, file))] = getFileHash(file);
  }
  return JSON.stringify(hashObj);
}

/**
 * Scan directory for Vue files, excluding certain directories
 */
export function scanVueFiles(rootDir: string): string[] {
  const files: string[] = [];
  const stack: string[] = [rootDir];

  while (stack.length > 0) {
    const dir = stack.pop()!;
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (EXCLUDED_DIRS.has(entry.name)) {
          continue;
        }
        stack.push(fullPath);
        continue;
      }

      if (entry.isFile() && entry.name.endsWith('.vue')) {
        files.push(fullPath);
      }
    }
  }

  return files.sort();
}
