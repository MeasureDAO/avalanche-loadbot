import { exec as cChainExec } from './c-chain';
import { init, LoadBotParam } from './command';

let command = init();

let params = command.opts() as LoadBotParam;
command.parse();

await cChainExec();