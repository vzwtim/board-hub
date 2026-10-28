import {isleworksFiles} from '../../code-kit/bundle.ts';
import {compileCode} from '../../server/code-platform/compiler.ts';
const files=isleworksFiles();delete files['runtime/server.mjs'];
export const artifact=compileCode(files);
