import { Command, Option } from 'commander';

type LoadBotParam = {
  rpc: URL;

  mode: 'c' | 'x';

  amount: number;
  rate: number;
  sender: string;
  waitTillFinalized: boolean;
  chainID: number;
};
export const program = new Command('avalanche-loadbot');
export function initProgram() {
  program
    .name('avalanche-loadbot')
    .version(`avalanche-loadbot ${require('../package.json').version}`);

  program
    .option(
      '--rpc <URL>',
      "URL of Avalanche node's RPC listener, should be full path",
      (val) => {
        return new URL(val);
      },
      new URL('http://127.0.0.1:9650/ext/bc/C/rpc')
    )

    .option(
      '--amount <number>',
      'Amount N of total transactions to submit',
      (val) => {
        return parseInt(val);
      },
      1000
    )
    .option(
      '--chain-id',
      'Chain ID of Avalanche',
      (val) => {
        return parseInt(val);
      },
      43112
    )
    // NOTE Unused currently
    .option(
      '--rate <number>',
      'Target submission rate',
      (val, prev) => {
        return parseInt(val);
      },
      50
    )
    .requiredOption(
      '--sender <address>',
      'Sender Address',
      (val) => {
        return '';
      },
      ''
    )
    .option(
      '--wait-till-finalized',
      'Wait untill all transactions finalized',
      true
    );

  program.addOption(
    new Option('--mode <c,x>', 'Mode to operation')
      .choices(['c', 'x'])
      .default('c')
  );

  program.on('command:*', () => {
    program.help();
    process.exitCode = 1;
  });
}
export const timer = process.hrtime();

export const lParams = program.opts() as LoadBotParam;
export const lp = program.opts() as LoadBotParam;
