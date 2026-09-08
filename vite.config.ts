import {defineConfig, createLogger} from 'vite'
import injectHTML from 'vite-plugin-html-inject';
import {covers} from './tools/covers-plugin';
import {flattenHtmlOutputs} from './tools/flatten-html-outputs';
import {cleanupSvg} from './tools/cleanup-svg';
import {cjsRules} from './tools/cjs-rules';

const SUPPRESSED = [
  "can't be bundled without type=\"module\"",
  "doesn't exist at build time",
]
const logger = createLogger()
const warn = logger.warn.bind(logger)
const warnOnce = logger.warnOnce.bind(logger)
const suppress = (msg: string) => SUPPRESSED.some(s => msg.includes(s))
logger.warn = (msg, options) => {
  if (!suppress(msg)) warn(msg, options)
}
logger.warnOnce = (msg, options) => {
  if (!suppress(msg)) warnOnce(msg, options)
}

export default defineConfig({
  customLogger: logger,
  plugins: [covers(), injectHTML(), cleanupSvg(), flattenHtmlOutputs(), cjsRules()],
  base:'./',
  build: {
    outDir: '../../server/public/lew-morski/',
    // outDir: 'out',
    minify: false,
    modulePreload: false,
    rollupOptions: {
      preserveEntrySignatures: 'exports-only',
      onwarn(warning, warn) {
        if (warning.code === 'EVAL') return;
        warn(warning);
      },
      input: {
        play: 'src/play/play.html',
        about: 'src/about.html',
        create: 'src/create.html',
        rules: 'src/rules/rules.ts',
      },
      output: {
        format:'commonjs',
        cleanDir: true,
        chunkFileNames: '[name][extname]',
        entryFileNames: '[name].js',
        assetFileNames: '[name][extname]'
      },
    },
  },
})
