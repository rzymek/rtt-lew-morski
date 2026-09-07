import {defineConfig} from 'vite'
import injectHTML from 'vite-plugin-html-inject';

export default defineConfig({
  root: 'src',
  plugins: [injectHTML(),cleanupSvg()],
  build: {
    outDir: '../../../server/public/lew-morski',
    minify: false,
    modulePreload: false,
    rollupOptions: {
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