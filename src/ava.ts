import { Avalanche, BinTools } from 'avalanche';
import { Defaults } from 'avalanche/dist/utils';
import { lParams } from './command';

const xchainID = Defaults.network[1337].X.blockchainID!;
// const cchainID = Defaults.network[1337].C.chainID!;
export const avalanche = () =>
  new Avalanche(
    lParams.rpc.hostname,
    parseInt(lParams.rpc.port),
    undefined,
    1337,
    xchainID
  );
export const bintool = BinTools.getInstance();
