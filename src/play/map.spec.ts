import {expect, it} from "vitest";
import svg from "./map.svg?raw";

// common/client.js looks the map up by this id: without it the page fails to start.
it('map root has the id expected by the framework client', () => {
  expect(svg).toMatch(/<svg id="map"/);
});
