import type {Plugin} from 'vite';
import {readFileSync} from "node:fs"

export function appendRttFramework(): Plugin {
  return {
    name: 'appendRttFramework',
    generateBundle(_opts, bundle) {
      const chunk = bundle['rules.js']
      if (chunk?.type !== 'chunk') return
      const js = readFileSync(import.meta.dirname + "/framework.js", {encoding: 'utf-8'})
      chunk.code = chunk.code + '\n\n' + js;
    }
  }
}
