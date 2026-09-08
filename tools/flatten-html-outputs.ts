import type { Plugin, ResolvedConfig } from 'vite';
import { readdirSync, renameSync, rmSync } from 'fs';
import { join, basename } from 'path';

export function flattenHtmlOutputs(): Plugin {
  let outDir: string;
  return {
    name: 'flattenHtmlOutputs',
    apply: 'build',
    configResolved(config: ResolvedConfig) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      const srcDir = join(outDir, 'src');
      for (const file of readdirSync(srcDir, { recursive: true }) as string[]) {
        if (file.endsWith('.html'))
          renameSync(join(srcDir, file), join(outDir, basename(file)));
      }
      rmSync(srcDir, { recursive: true, force: true });
    },
  };
}
