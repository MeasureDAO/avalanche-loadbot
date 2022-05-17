import { Avalanche, BinTools } from 'avalanche';
import { Defaults } from 'avalanche/dist/utils';

import { LoadBotParams } from './command';

const xchainID = Defaults.network[1337].X.blockchainID!;
// const cchainID = Defaults.network[1337].C.chainID!;

export const avalanche = (params: LoadBotParams) =>
  new Avalanche(
    params.rpc.hostname,
    parseInt(params.rpc.port),
    undefined,
    1337,
    xchainID //todo: should it really be X-chain?
  );

export const bintool = BinTools.getInstance();
