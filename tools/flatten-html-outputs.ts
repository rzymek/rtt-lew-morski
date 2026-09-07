import type { Plugin } from 'vite';
import { readdirSync, renameSync, rmSync } from 'fs';
import { join, basename } from 'path';

export function flattenHtmlOutputs(): Plugin {
  return {
    name: 'flattenHtmlOutputs',
    apply: 'build',
    closeBundle() {
      for (const file of readdirSync('out/src', { recursive: true }) as string[]) {
        if (file.endsWith('.html'))
          renameSync(join('out/src', file), join('out', basename(file)));
      }
      rmSync('out/src', { recursive: true, force: true });
    },
  };
}
