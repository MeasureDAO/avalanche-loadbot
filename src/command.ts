import { Command, Option } from 'commander';

export type LoadBotParams = {
  rpc: URL;

  mode: 'plain' | 'contract';

  amount: number;
  rate: number;
  sender: string;
  chainID: number;
};

export function init(): Command {
  let program = new Command('avalanche-loadbot');

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
      '--chain-id <number>',
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
      100
    )
    .option(
      '--sender <address>',
      'Sender Address',
      (val) => {
        return '';
      },
      ''
    );
  program.addOption(
    new Option('--mode <plain, contract>', 'Mode to operation')
      .choices(['plain', 'contract'])
      .default('contract')
  );

  program.on('command:*', () => {
    program.help();
    process.exitCode = 1;
  });

  return program;
}
