import {mkdir,cp} from 'node:fs/promises';
import {build} from 'esbuild';
await mkdir('dist/server',{recursive:true});
await cp('out','dist/client',{recursive:true});
await build({entryPoints:['worker/index.ts'],outfile:'dist/server/index.js',bundle:true,format:'esm',platform:'browser',target:'es2022'});
await mkdir('dist/.openai',{recursive:true});
await cp('.openai/hosting.json','dist/.openai/hosting.json');
await cp('drizzle','dist/.openai/drizzle',{recursive:true});
