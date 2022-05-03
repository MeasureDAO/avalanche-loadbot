import { BinTools } from 'avalanche';
import { Command } from 'commander';
import ora from 'ora';
import { avalanche } from './ava';
import { cChainExec } from './c-chain';
import { initProgram, lParams, program } from './command';
import { xChainExec } from './x-chain';

initProgram();

program.parse();

// program.parse();
switch (lParams.mode) {
  case 'c': {
    cChainExec();
    break;
    // process.exit();
    // debugger;
  }
  case 'x': {
    xChainExec();
    break;
    // debugger;
  }
}
