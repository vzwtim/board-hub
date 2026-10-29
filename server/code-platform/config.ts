import {env} from 'cloudflare:workers';
import {CodeGitHub,type GitHubConfig} from './github.ts';
import type {SandboxLoader} from './compiler.ts';
export interface CodeEnvironment {OPENAI_API_KEY?:string;CODE_LOADER?:SandboxLoader;BOARDHUB_CODE_ENABLED?:string;BOARDHUB_GITHUB_APP_ID?:string;BOARDHUB_GITHUB_APP_PRIVATE_KEY?:string;BOARDHUB_GITHUB_WEBHOOK_SECRET?:string;BOARDHUB_GITHUB_REPOSITORY?:string;BOARDHUB_GITHUB_BRANCH?:string;BOARDHUB_GITHUB_INSTALL_URL?:string}
export const codeEnvironment=()=>env as unknown as CodeEnvironment;
export function githubConfig(e=codeEnvironment()):GitHubConfig{return {appID:e.BOARDHUB_GITHUB_APP_ID,privateKey:e.BOARDHUB_GITHUB_APP_PRIVATE_KEY,webhookSecret:e.BOARDHUB_GITHUB_WEBHOOK_SECRET,managedRepository:e.BOARDHUB_GITHUB_REPOSITORY,managedBranch:e.BOARDHUB_GITHUB_BRANCH,installURL:e.BOARDHUB_GITHUB_INSTALL_URL}}
export const runtimeLoader=()=>codeEnvironment().BOARDHUB_CODE_ENABLED==='true'?codeEnvironment().CODE_LOADER:undefined;
export const codeGitHub=()=>new CodeGitHub(githubConfig());
export function capabilities(){const e=codeEnvironment(),github=!!(e.BOARDHUB_GITHUB_APP_ID&&e.BOARDHUB_GITHUB_APP_PRIVATE_KEY);return {ai:!!e.OPENAI_API_KEY,github,upload:github&&!!e.BOARDHUB_GITHUB_REPOSITORY,runtime:!!e.CODE_LOADER&&e.BOARDHUB_CODE_ENABLED==='true',automatic:github&&!!e.BOARDHUB_GITHUB_WEBHOOK_SECRET,installURL:e.BOARDHUB_GITHUB_INSTALL_URL||null}}
