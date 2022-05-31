import { Avalanche, BinTools } from "avalanche";
import { Defaults } from "avalanche/dist/utils";
import { lParams } from "./command";

const CHAIN_ID = 1337;

const xchainID = Defaults.network[CHAIN_ID].X.blockchainID!;
// const cchainID = Defaults.network[1337].C.chainID!;

export const avalanche = () =>
  new Avalanche(
    lParams.rpc.hostname,
    parseInt(lParams.rpc.port),
    undefined,
    CHAIN_ID,
    xchainID
  );
export const bintool = BinTools.getInstance();
