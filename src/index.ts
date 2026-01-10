import fs from 'node:fs';
import path from 'node:path';

import { buildFileHash } from './fs-utils.js';
import { loadCache, saveCache } from './cache.js';
import { buildRoutes, type RouteData } from './route-builder.js';
import { renderRoutesFile } from './code-gen.js';

// Re-export types from route-builder for external use
export type { RouteEntry, RouteData } from './route-builder.js';

export interface GenerateRoutesOptions {
  pagesDir?: string;
  outFile?: string;
}

export function generateRoutes({
  pagesDir = path.resolve(process.cwd(), 'src/pages'),
  outFile = path.resolve(process.cwd(), 'src/router/route.gen.ts'),
}: GenerateRoutesOptions = {}): boolean {
  if (!fs.existsSync(pagesDir)) {
    throw new Error(`Pages directory not found: ${pagesDir}`);
  }

  // Load cache and check if we can skip generation
  const cache = loadCache();
  const currentFilesHash = buildFileHash(pagesDir);

  // If files haven't changed and output exists, skip generation
  if (cache.files === currentFilesHash && fs.existsSync(outFile)) {
    return false;
  }

  const data: RouteData = buildRoutes({ pagesDir, outFile });
  const output = renderRoutesFile(data);

  fs.mkdirSync(path.dirname(outFile), { recursive: true });

  if (fs.existsSync(outFile)) {
    const current = fs.readFileSync(outFile, 'utf8');
    if (current === output) {
      // Save cache even if output unchanged
      saveCache({ files: currentFilesHash, lastRoutesHash: currentFilesHash });
      return false;
    }
  }

  fs.writeFileSync(outFile, output, 'utf8');

  // Save cache after successful generation
  saveCache({ files: currentFilesHash, lastRoutesHash: currentFilesHash });
  return true;
}
