import type { Plugin } from 'vite';

export function cjsRules(): Plugin {
  return {
    name: 'cjs-rules',
    generateBundle(_opts, bundle) {
      const chunk = bundle['rules.js']
      if (chunk?.type !== 'chunk' || !chunk.exports.length) return
      chunk.code = chunk.code.replace(
        /\nexport \{[\s\S]*?\};\s*$/,
        '\n' + chunk.exports.map(e => `exports.${e} = ${e};`).join('\n') + '\n'
      )
    }
  }
}
