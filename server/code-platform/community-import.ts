import communityRules from '../../games/community/index.ts?raw';
import communityAdapter from '../../code-kit/community/game.ts?raw';
import communityUI from '../../code-kit/community/ui.html?raw';
import {isleworksFiles} from '../../code-kit/bundle.ts';
import type {Spec} from '../../games/community/index.ts';
import type {SourceFiles} from './model.ts';

export function communityCodeFiles(spec:Spec,origin:{id:string;version:string;author:string}):SourceFiles {
  const starter=isleworksFiles();
  const manifest=JSON.parse(starter['manifest.json']);
  return {
    'manifest.json':JSON.stringify({...manifest,id:'community-grid',title:spec.title,forkOf:origin},null,2)+'\n',
    'game.ts':communityAdapter.replaceAll('../../sdk/','./sdk/').replaceAll('../../games/','./games/')
      +'\nexport default createGame('+JSON.stringify(spec,null,2)+');\n',
    'ui.html':communityUI,
    'games/community/index.ts':communityRules,
    'engine/core.ts':starter['engine/core.ts'],
    'engine/types.ts':starter['engine/types.ts'],
    'sdk/code-game.ts':starter['sdk/code-game.ts'],
    'LICENSE':starter.LICENSE,
  };
}
