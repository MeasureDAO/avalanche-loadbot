import { exec as cChainExec } from './c-chain';
import { init, LoadBotParams } from './command';

let command = init();

let params = command.opts() as LoadBotParams;
command.parse();

await cChainExec();