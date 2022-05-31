import consola from "consola";
import ora, { Ora } from "ora";
import { BlockTransactionString } from "web3-eth";

export const spin = (name: string): Ora => {
  return ora(`Benchmarking C-Chain ${name} Performance`).start();
};

export const logResults = ({
  finishedCount,
  failedCount,
  avgCost,
  fastestTxTurnAround,
  slowestTxTurnaround,
  totalLoadboxExecTime,
  blocksLength,
  blkTimestamps,
  blockTxs,
  senderEthAddr,
  senderEthBalance,
  senderEthPrivateKey,
  recieverEthAddr,
  recieverEthBalance,
  recieverEthPrivateKey,
}: {
  finishedCount: number;
  failedCount: number;
  avgCost: number;
  fastestTxTurnAround: number;
  slowestTxTurnaround: number;
  totalLoadboxExecTime: number;
  blocksLength: number;
  blkTimestamps: number[];
  blockTxs: BlockTransactionString[];
  senderEthAddr: string;
  senderEthBalance: string;
  senderEthPrivateKey: string;
  recieverEthAddr: string;
  recieverEthBalance: string;
  recieverEthPrivateKey: string;
}) => {
  consola.success("Finished Testing C-Chain!");
  consola.info("=====[LOADBOT RUN]==========");

  consola.info(`[COUNT DATA]
    Transactions submitted = ${finishedCount}
    Transactions failed    = ${failedCount}
          `);

  consola.info(`[TURN AROUND DATA]
    Average transaction turn around = ${avgCost} s
    Fastest transaction turn around = ${fastestTxTurnAround} s
    Slowest transaction turn around = ${slowestTxTurnaround} s
    Total loadbot execution time    = ${totalLoadboxExecTime} s
          `);

  consola.info(`[BLOCK DATA]
    Blocks required = ${blocksLength}
    
    ${blockTxs
      .map((val, idx) => {
        return `Block #${val.number} = ${val.transactions.length} txns, time cost ${blkTimestamps[idx]} s`;
      })
      // End with next line tail
      .join("\n")} 
          `);

  consola.info(` [Balance Info]
      Sender ${senderEthAddr} : ${senderEthBalance} AVAX
        privateKey: ${senderEthPrivateKey}
      Receiver ${recieverEthAddr}: ${recieverEthBalance} AVAX
        privateKey: ${recieverEthPrivateKey}
    `);
};
