import { cChainExec } from "./c-chain";
import { initProgram, program } from "./command";
// import { xChainExec } from './x-chain';

initProgram();

program.parse();

cChainExec();
// case 'x': {
//   xChainExec();
//   break;
//   // debugger;
// }
