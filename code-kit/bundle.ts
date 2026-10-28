import core from '../engine/core.ts?raw';
import types from '../engine/types.ts?raw';
import sdk from '../sdk/code-game.ts?raw';
import rules from '../games/frontier/index.ts?raw';
import bot from '../games/frontier/bot.ts?raw';
import topology from '../games/frontier/topology.ts?raw';
import feedback from '../games/frontier/feedback.ts?raw';
import parser from '../games/frontier/parse.ts?raw';
import adapter from './isleworks/game.ts?raw';
import manifest from './isleworks/manifest.json?raw';
import ui from './isleworks/ui.html?raw';
import readme from './isleworks/README.md?raw';
import prompt from './isleworks/AI_REQUEST.md?raw';
import tests from './isleworks/contract.test.txt?raw';
import host from './runtime/server.mjs?raw';
import license from '../LICENSE?raw';

/** Explicit allowlist: never include app credentials, database code or repository metadata. */
export function isleworksFiles():Record<string,string> {
 return {
  'manifest.json':manifest,
  'package.json':JSON.stringify({name:'boardhub-isleworks-kit',version:'0.1.0',private:true,type:'module',engines:{node:'>=24'},scripts:{start:'node runtime/server.mjs .',test:'node --test contract.test.ts'}},null,2)+'\n',
  '.gitignore':'.boardhub/\nnode_modules/\n.env*\n',
  'game.ts':adapter.replaceAll('../../sdk/','./sdk/').replaceAll('../../games/','./games/'),
  'ui.html':ui,'README.md':readme,'AI_REQUEST.md':prompt,'LICENSE':license,
  'engine/core.ts':core,'engine/types.ts':types,'sdk/code-game.ts':sdk,
  'games/frontier/index.ts':rules,'games/frontier/bot.ts':bot,'games/frontier/topology.ts':topology,
  'games/frontier/feedback.ts':feedback,'games/frontier/parse.ts':parser,
  'runtime/server.mjs':host,'contract.test.ts':tests,
 };
}
