import type {SourceFiles} from '../server/code-platform/model.ts';
export const handoffEditable=(path:string)=>path==='game.ts'||path==='ui.html'||path==='manifest.json'||path.startsWith('games/')||path.startsWith('assets/');
export function developmentBrief(title:string,request:string,revision:number){return `# ${title} — 改良の依頼\n\n## 依頼内容\n${request.trim()||'遊び方・画面・ルールの改善案を相談し、決めた変更を実装してください。'}\n\n## 進め方\n1. まず依頼を読み、現在の仕様と影響範囲を確認してください。\n2. ゲームのルール・UI・CPUを揃えて変更し、テストしてください。\n3. 変更点、試したこと、残る制約を説明してください。\n4. 完成したフォルダを返してください。BoardHubで差分を確認し、試遊してから採用します。GitHubを使う場合はブランチとPRでレビューします。\n\n## 成果物の条件\n- 基準の下書き: revision ${revision}\n- game.ts、ui.html、manifest.json、games/、assets/ が編集対象です。\n- 外部パッケージや外部ネットワークを追加せず、制作キットの実行基盤は変更しないでください。\n- ライセンス、派生元、出典を引き継いでください。\n- 追加した操作は入力検証・ルール・画面・CPUに反映してください。\n- 秘密情報をファイルに含めないでください。\n\n## BoardHubへの戻し方\nZIPを展開し、制作画面の「完成したフォルダを選ぶ」で game.ts と ui.html の入ったフォルダを選択します。差分確認 → 試遊 → 採用の順に進めます。\n`;}
export function returnedSource(current:SourceFiles,incoming:SourceFiles){
 const next={...current};
 for(const [path,content] of Object.entries(incoming))if(handoffEditable(path))next[path]=content;
 return {files:next,changed:Object.keys(next).filter(path=>next[path]!==current[path])};
}
