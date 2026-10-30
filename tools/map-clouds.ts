import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {DOMParser} from '@xmldom/xmldom';
import type {Plugin} from 'vite';
import {useNamespaces} from 'xpath';

const VIRTUAL_ID = 'virtual:map-clouds';
const RESOLVED_ID = '\0' + VIRTUAL_ID;
// The Inkscape source: src/play/map.svg is exported from it without the layer labels.
const MAP_SVG = resolve(__dirname, '../public/app.svg');

const select = useNamespaces({
  svg: 'http://www.w3.org/2000/svg',
  inkscape: 'http://www.inkscape.org/namespaces/inkscape',
});

function hexesOfLayer(svg: Document, label: string): string[] {
  const ids = select(`//svg:g[@inkscape:label="${label}"]//svg:use/@id`, svg) as Attr[];
  if (ids.length === 0) throw new Error(`${MAP_SVG}: no hexes in layer "${label}"`);
  return ids.map(it => it.value);
}

// Rules run on the server, without the map: gives them just the cloud hexes of its layers.
export function mapClouds(): Plugin {
  return {
    name: 'map-clouds',
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : undefined;
    },
    load(id) {
      if (id !== RESOLVED_ID) return;
      this.addWatchFile(MAP_SVG);
      const svg = new DOMParser().parseFromString(readFileSync(MAP_SVG, 'utf8'), 'image/svg+xml') as unknown as Document;
      return [
        `export const CLOUD_HEXES = ${JSON.stringify(hexesOfLayer(svg, 'cloudy'))};`,
        `export const CLOUD_EDGE_HEXES = ${JSON.stringify(hexesOfLayer(svg, 'partially-cloudy'))};`,
      ].join('\n');
    },
  };
}
