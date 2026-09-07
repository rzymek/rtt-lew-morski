import type { Plugin } from 'vite';

export function cleanupSvg(): Plugin {
  const baseUrl = new URL('.', import.meta.url).href;
  const escaped = baseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return {
    name: 'cleanupSvg',
    transformIndexHtml(html: string) {
      return html.replace(new RegExp(escaped, 'gui'), './');
    },
  };
}
