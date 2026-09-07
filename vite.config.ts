import {defineConfig, createLogger} from 'vite'
import injectHTML from 'vite-plugin-html-inject';

const logger = createLogger()
const warn = logger.warn.bind(logger)
logger.warn = (msg, options) => {
  if (msg.includes("can't be bundled without type=\"module\"")) return
  if (msg.includes("doesn't exist at build time")) return
  warn(msg, options)
}

export default defineConfig({
  customLogger: logger,
  root: 'src',
  plugins: [injectHTML(),cleanupSvg()],
  build: {
    outDir: '../../../server/public/lew-morski',
    minify: false,
    modulePreload: false,
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'EVAL') return;
        warn(warning);
      },
      input: {
        play: 'play/play.html',
        rules: 'rules/rules.js',
      },
      output: {
        cleanDir: true,
        chunkFileNames: '[name][extname]',
        entryFileNames: '[name].js',
        assetFileNames: '[name][extname]'
      },
    },
  },
})

function cleanupSvg() {
  const baseUrl = new URL('.', import.meta.url).href;
  const escaped = baseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return {
    name: 'cleanupSvg',
    transformIndexHtml(html: string) {
      return html.replace(new RegExp(escaped, 'gui'), './')
    },
  };
}