import {
  DefaultEVMLocalGenesisAddress as EVMAddr,
  DefaultEVMLocalGenesisPrivateKey as EVMPrivKey,
} from "avalanche/dist/utils";
import Web3 from "web3";
import { Eth } from "web3-eth";
import { TransactionConfig, TransactionReceipt } from "web3-core";
import { Contract } from "web3-eth-contract";

import abi from "./assets/abi.json";
import { DEFAULT_CONTRACT_BYTECODE } from "./contract";

let recvAccountAddr: string;
let recvAccountPrivateKey: string;

export const getRecvAccountAddress = () => recvAccountAddr;
export const getRecvAccountPrivateKey = () => recvAccountAddr;

const sendTxn = async (
  eth: Eth,
  nonce: number,
  address: string
): Promise<TransactionReceipt> => {
  // Send avax
  const tx: TransactionConfig = {
    to: address,
    nonce,
    value: Web3.utils.toWei("0.1", "ether"),
  };
  tx.gas = await eth.estimateGas(tx);

  return eth.sendTransaction(tx);
};

export const deployContract = async (eth: Eth): Promise<Contract> => {
  const contract = new eth.Contract(abi as any);
  const nonce = await eth.getTransactionCount(EVMAddr);
  const tx = contract.deploy({
    data: DEFAULT_CONTRACT_BYTECODE,
    arguments: ["AVAX TEST"],
  });

  return tx.send({
    gas: await tx.estimateGas(),
    from: EVMAddr,
    nonce,
  });
};

export const runContractTx = async (
  contract: Contract,
  rate: number,
  nonce: number,
  onSuccess: (val: TransactionReceipt) => void,
  onFailure: (e: any) => void
) => {
  const contractTx = await contract.methods.setGreeting("AVAX TEST TX");
  for (let i = 0; i < rate; i++) {
    (
      contractTx.send({
        from: EVMAddr,
        nonce: nonce + i,
        gas: await contractTx.estimateGas(),
      }) as Promise<TransactionReceipt>
    )
      .then(onSuccess)
      .catch(onFailure);
  }
};

export const runValueTx = async (
  eth: Eth,
  recvAccountAddress: string,
  rate: number,
  nonce: number,
  handleTxSuccess: (val: TransactionReceipt) => void,
  handleTxFailure: (e: Error) => void
) => {
  for (let i = 0; i < rate; i++) {
    sendTxn(eth, nonce + i, recvAccountAddress)
      .then(handleTxSuccess)
      .catch(handleTxFailure);
  }
};

export const getEthInstance = (url: string): Eth => {
  const web3 = new Web3(url);
  const { eth } = web3;

  // Setup account for Value Transfer
  const recvAccount = web3.eth.accounts.create();
  recvAccountAddr = recvAccount.address;
  recvAccountPrivateKey = recvAccount.privateKey;

  eth.accounts.wallet.add(recvAccount);
  eth.defaultAccount = EVMAddr;
  eth.accounts.wallet.add(EVMPrivKey);

  return eth;
};
