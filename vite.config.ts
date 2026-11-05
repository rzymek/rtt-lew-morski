import {defineRttModule} from '@rzymek/rally-the-troops-module/vite';
import {mapClouds} from './tools/map-clouds.ts'

export default defineRttModule({
  name: 'lew-morski',
  plugins: [mapClouds()]
})