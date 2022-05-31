import { avalanche } from "./ava";
import {
  PrivateKeyPrefix,
  DefaultEVMLocalGenesisAddress as EVMAddr,
  DefaultEVMLocalGenesisPrivateKey as EVMPrivKey,
  DefaultLocalGenesisPrivateKey,
} from "avalanche/dist/utils";
import Web3 from "web3";
import { Contract } from "web3-eth-contract";
import { lParams } from "./command";
import { TransactionReceipt } from "web3-core";
import ora from "ora";
import { autorun, observable, runInAction } from "mobx";
import consola from "consola";
import dayjs from "dayjs";
import {
  deployContract,
  getEthInstance,
  runContractTx,
  runValueTx,
  getRecvAccountAddress,
  getRecvAccountPrivateKey,
} from "./eth";
import { logResults, spin } from "./formatter";

const SEC_PRE_NS = 1e-9;

// The main execution function for C-Chain
export async function cChainExec() {
  const { rate, amount, rpc, mode } = lParams;

  /* ETH API SETUP */
  const eth = getEthInstance(rpc.toString());
  const recvAccountAddress = getRecvAccountAddress();

  /* AVAX API SETUP */
  const cchain = avalanche().CChain();
  const cKeyChain = cchain.keyChain();
  cKeyChain.importKey(`${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`);

  /* OBSERVABLE STATE HANDLING */
  let blkNum = observable<number>([]);
  let finishedCount = observable.box(0);
  let lastTxHash = observable.box("");

  const pushTxResult = (val: TransactionReceipt) => {
    runInAction(() => {
      // Record the block number
      !blkNum.includes(val.blockNumber) && blkNum.push(val.blockNumber);
    });
    // Set last transaction
    if (finishedCount.get() === amount) {
      runInAction(() => lastTxHash.set(val.transactionHash));
    }
  };

  const handleTxSuccess = (val: TransactionReceipt) => {
    pushTxResult(val);
    runInAction(() => {
      const val = finishedCount.get() + 1;
      finishedCount.set(val);
    });
  };

  const handleTxFailure = (e: Error) => {
    runInAction(() => {
      const val = finishedCount.get() + 1;
      finishedCount.set(val);
    });
    failedCount++;
    consola.error(e);
  };

  /* REGULAR STATE */
  const lastExecCounts = amount % rate;
  const txStart = dayjs();
  let waiting: ora.Ora;
  let contract: Contract;
  let startNonce: number;
  let failedCount = 0;
  let totalExecTimes = parseInt((amount / rate).toString());
  let execTimes = 0;
  let timeout: NodeJS.Timeout;
  let timer: [number, number] | undefined = undefined;

  /* FLOW CONTROL */
  const preExec = async () => {
    switch (mode) {
      case "plain":
        // await setStartNonce();
        startNonce = await eth.getTransactionCount(EVMAddr);
        consola.info("START AT:", startNonce);
        waiting = spin("Plain-Value Transfer");
        break;
      case "contract":
        contract = await deployContract(eth);
        // get start nonce after deploy contract in order to avoid duplicating.
        startNonce = await eth.getTransactionCount(EVMAddr);
        consola.info("START AT:", startNonce);

        waiting = spin("Contract Deploy Transfer");
        break;
    }
  };

  const exec = async (rate: number, nonce?: number) => {
    const currentNonce = nonce ? startNonce + nonce : startNonce;

    switch (mode) {
      case "plain": {
        await runValueTx(
          eth,
          recvAccountAddress,
          rate,
          currentNonce,
          handleTxSuccess,
          handleTxFailure
        );
        break;
      }

      case "contract": {
        await runContractTx(
          contract,
          rate,
          currentNonce,
          handleTxSuccess,
          handleTxFailure
        );
        break;
      }
    }
  };

  const runner = async () => {
    // check everytime when the execTime increment
    if (execTimes === totalExecTimes) {
      // Set Timeout
      //timeout = setTimeout(() => {
      //  waiting.stop();
      //  consola.error(
      //    'Timeout! Try to re-run the loadbot with another parameters.'
      //  );
      //  process.exit(1);
      //}, 60 * 1000);

      waiting.text = "Finished benchmarking, waiting for results...";

      clearInterval(run);
      return;
    }

    let nonce;

    // First time setup
    consola.info("SEND ROUND", execTimes);

    if (execTimes !== 0) {
      nonce = rate * execTimes;
    }
    consola.info("NONCE COUNT", nonce ?? 0);
    execTimes++;

    let currentRate = lastExecCounts ? lastExecCounts : rate;
    await exec(currentRate, nonce);
  };

  /* LOGIC EXECUTION START */

  if (execTimes === 0) {
    await preExec();
    consola.info("\n TOTAL ROUND TIMES:", totalExecTimes);
  }

  // TODO/Question - probably not the right place for timer initialisation. Maybe need to move somewhere closer to where we send 1st tx
  if (!timer) {
    consola.info("Sending first transaction");
    timer = process.hrtime();
  }

  const run = setInterval(async () => {
    await runner();
  }, 1000);

  // Note: this is a reactive side-effect fn that will execute each time any of it's dependendancies (observables) change
  autorun(async () => {
    if (finishedCount.get() === amount && !lastTxHash.get()) {
      clearTimeout(timeout);
      waiting.stop();
      // get metric data
      let blkInfos = await Promise.all(
        blkNum.map(async (val) => {
          return await eth.getBlock(val);
        })
      );
      blkInfos = blkInfos.sort((a, b) => a.number - b.number);
      // NOTE ALL TIMESTAMP REPESENTED IN SECONDS
      // Avalanche Timestamp is Unix's Timestamp (in second), but js not (in miliseconds)
      const timestamps = blkInfos.map((val) => val.timestamp as number);
      const blkTimestamps = timestamps.map((val, idx) => {
        if (idx === 0) {
          // Compare with start time, need to converted to unix timestamp
          return val - txStart.unix();
        }
        // Compare two blocks diffrence
        return val - timestamps[idx - 1];
      });
      const latestBlkTimestap = dayjs.unix(
        Number(blkInfos[blkInfos.length - 1].timestamp)
      );
      const avgCost =
        (latestBlkTimestap.valueOf() - txStart.valueOf()) /
        blkNum.length /
        1000;

      logResults({
        finishedCount: finishedCount.get(),
        failedCount,
        avgCost,
        fastestTxTurnAround: blkTimestamps[0],
        slowestTxTurnaround: blkTimestamps[blkTimestamps.length - 1],
        totalLoadboxExecTime:
          process.hrtime(timer)[0] + process.hrtime(timer)[1] * SEC_PRE_NS,
        blocksLength: blkNum.length,
        blockTxs: blkInfos,
        senderEthAddr: EVMAddr,
        senderEthBalance: Web3.utils.fromWei(
          await eth.getBalance(EVMAddr),
          "ether"
        ),
        senderEthPrivateKey: EVMPrivKey,
        recieverEthAddr: recvAccountAddress,
        recieverEthBalance: Web3.utils.fromWei(
          await eth.getBalance(recvAccountAddress),
          "ether"
        ),
        recieverEthPrivateKey: getRecvAccountPrivateKey(),
        blkTimestamps,
      });
    }
  });
}
