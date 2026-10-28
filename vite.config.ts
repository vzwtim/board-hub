import {typescriptWorkerPlugin} from './scripts/typescript-worker-plugin.mjs';
import vinext from 'vinext';
import {defineConfig} from 'vite';
import {cloudflare} from '@cloudflare/vite-plugin';
export default defineConfig({server:{host:'0.0.0.0',allowedHosts:['terminal.local']},plugins:[typescriptWorkerPlugin(),vinext(),cloudflare({viteEnvironment:{name:'rsc',childEnvironments:['ssr']},inspectorPort:false})]});
