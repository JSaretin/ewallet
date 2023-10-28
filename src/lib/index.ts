import type Web3 from "web3";
import { DEXROUTERABI, ERC20ABI } from "./abis";
import type { Writable } from "svelte/store";

export interface FeedBack {
  message: string;
  type: 'error' | 'info' | 'success' | 'danger'
}
export class SeamlessOrder {
  dexRouter: any;
  web3: Web3;
  feedBacks: Writable<FeedBack[]>;
  //   account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
  account: any;

  constructor(privateKey: string, web3: Web3, feedBackStore: Writable<FeedBack[]>) {
    this.web3 = web3;
    this.account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
    this.dexRouter = new this.web3.eth.Contract(
      DEXROUTERABI,
      "0x10ED43C718714eb63d5aA57B78B54704E256024E"
    );
    this.feedBacks = feedBackStore;
  }

  addFeedback(feedback: FeedBack) {
    this.feedBacks.update(fds => [feedback, ...fds])

  }

  async _estimateGas(txSetting: object): Promise<bigint | void> {
    let gas: bigint;
    try {
      gas = await this.web3.eth.estimateGas(txSetting);
    } catch (e: any) {
      this.addFeedback({ message: e?.message as string, type: 'error' })
      return;
    }
    return gas;
  }

  async _publishTransaction(txSetting: object) {
    let transaction: any;
    try {
      const sig = await this.account.signTransaction(txSetting);
      transaction = await this.web3.eth.sendSignedTransaction(
        sig.rawTransaction
      );
    } catch (e: any) {
      this.addFeedback({ message: e?.message as string, type: 'error' })
      return;
    }
    console.log("transaction sent", transaction);
    return transaction;
  }

  async _hasGas(
    gas: bigint,
    txSetting: { [key: string]: any }
  ): Promise<boolean> {
    const cost = txSetting.gasPrice * gas;
    const totalCost = Number(
      this.web3.utils.fromWei(cost, "ether")
    ) + Number(this.web3.utils.fromWei(txSetting?.value || '0', 'ether'));
    const balance = await this.getBalance(this.account.address);
    if (balance < totalCost) {
      this.addFeedback({ message: "balance too low" as string, type: 'error' })
      return false;
    }
    return true;
  }

  async getBalance(address: string): Promise<number> {
    return Number(
      this.web3.utils.fromWei(await this.web3.eth.getBalance(address), "ether")
    );
  }

  async getTokenBalance(contractAddr: string, address: string): Promise<number> {
    const contract = new this.web3.eth.Contract(ERC20ABI, contractAddr);

    return Number(
      this.web3.utils.fromWei(await contract.methods.balanceOf(address).call(), "ether")
    );
  }

  async withdrawToken(contractAddr: string, amount: number, to: string) {
    const contract = new this.web3.eth.Contract(ERC20ABI, contractAddr);
    const data = (contract.methods.transfer as any)(
      this.web3.utils.toWei(amount.toString(), "ether"),
      to
    ).encodeABI();

    const gasPrice = await this.web3.eth.getGasPrice();

    const txSetting: { [key: string]: any } = {
      from: this.account.address,
      to: contractAddr,
      gasPrice,
      data,
    };

    const gas = await this._estimateGas(txSetting);
    if (!gas) return;

    const hasGas = await this._hasGas(gas, txSetting);
    if (!hasGas) return;

    let transaction: any = await this._publishTransaction({
      ...txSetting,
      gas,
    });
  }

  async withdrawCoin(amount: number, to: string) {
    const value = this.web3.utils.toWei(amount.toString(), "ether");
    const gasPrice = await this.web3.eth.getGasPrice();

    const txSetting: { [key: string]: any } = {
      value,
      from: this.account.address,
      to,
      gasPrice,
      nonce: await this.web3.eth.getTransactionCount(this.account.address)
    };
    const gas = await this._estimateGas(txSetting);
    if (!gas) return;

    const hasGas = await this._hasGas(gas, txSetting);
    if (!hasGas) return;

    let transaction: any = await this._publishTransaction({
      ...txSetting,
      gas,
    });
    return transaction
  }

  async _approveToken(
    contractAddr: string,
    spender: string,
    amount: number
  ): Promise<boolean> {
    const contract = new this.web3.eth.Contract(ERC20ABI, contractAddr);
    const data = (contract.methods.approve as any)(
      spender,
      this.web3.utils.toWei(amount.toString(), "ether")
    ).encodeABI();
    const gasPrice = await this.web3.eth.getGasPrice();

    const txSetting: { [key: string]: any } = {
      from: this.account.address,
      to: contractAddr,
      gasPrice,
      data,
      nonce: await this.web3.eth.getTransactionCount(this.account.address)
    };
    const gas = await this._estimateGas(txSetting);
    if (!gas) return false;

    const hasGas = await this._hasGas(gas, txSetting);
    if (!hasGas) return false;

    let transaction: any = await this._publishTransaction({
      ...txSetting,
      gas,
    });

    return true;
  }

  async estimateReturnReward(
    inContract: string,
    outContract: string,
    amount: number
  ): Promise<number | void> {
    try {
      return Number(
        this.web3.utils.fromWei(
          (
            await (this.dexRouter.methods.getAmountsOut as any)(
              this.web3.utils.toWei(amount.toString(), "ether"),
              [inContract, outContract]
            ).call()
          )[1],
          "ether"
        )
      );
    } catch (e) {
      console.log(e)
      return;
    }
  }

  async swapTokenToBnb(contractAddr: string, address: string, amount: number) {
    const estimatedReturn = await this.estimateReturnReward(
      contractAddr,
      await this.dexRouter.methods.WETH().call(),
      amount
    );

    if (!estimatedReturn) return;

    const toGet = estimatedReturn - (estimatedReturn * 20 / 100)
    const data = (
      this.dexRouter.methods
        .swapExactTokensForETHSupportingFeeOnTransferTokens as any
    )(
      this.web3.utils.toWei(amount.toString(), "ether"),
      this.web3.utils.toWei(toGet.toString(), 'ether'),
      [contractAddr, await this.dexRouter.methods.WETH().call()],
      address,
      new Date().getTime() + 1000 * 60 * 60 * 24
    ).encodeABI();

    const txSetting: { [key: string]: any } = {
      from: this.account.address,
      to: this.dexRouter._address,
      gasPrice: await this.web3.eth.getGasPrice(),
      data,
      nonce: await this.web3.eth.getTransactionCount(this.account.address)
    };

    const gas = await this._estimateGas(txSetting);
    if (!gas) return false;

    const hasGas = await this._hasGas(gas, txSetting);
    if (!hasGas) return false;

    let transaction: any = await this._publishTransaction({
      ...txSetting,
      gas,
    });
  }

  async sellTokenToBnb(contractAddr: string, address: string, amount: number) {
    const contract = new this.web3.eth.Contract(ERC20ABI, contractAddr);
    const balance = await contract.methods.balanceOf(this.account.address).call()
    if (Number(this.web3.utils.fromWei(balance, 'ether')) < amount) {
      this.addFeedback({ message: 'token balance too low', type: 'error' })
      return
    }
    const allowance = await (contract.methods.allowance as any)(
      this.account.address,
      this.dexRouter._address
    ).call();

    const formatedAllowance = Number(
      this.web3.utils.fromWei(allowance, "ether")
    );
    if (formatedAllowance < amount) {
      const approved = await this._approveToken(
        contractAddr,
        this.dexRouter._address,
        amount
      );
      if (!approved) return;
    }

    await this.swapTokenToBnb(contractAddr, address, amount);
  }

  estimateReturn() { }

  async buyTokenWithCoin(contractAddr: string, address: string, amount: number) {
    const value = this.web3.utils.toWei(amount.toString(), "ether");

    const estimatedReturn = await this.estimateReturnReward(
      await this.dexRouter.methods.WETH().call(),
      contractAddr,
      amount
    );

    if (!estimatedReturn) return;

    const toGet = estimatedReturn - (estimatedReturn * 20 / 100)

    const data = (
      this.dexRouter.methods
        .swapExactETHForTokens as any
    )(
      this.web3.utils.toWei(toGet.toString(), "ether"),
      [await this.dexRouter.methods.WETH().call(), contractAddr],
      address,
      new Date().getTime() + 1000 * 60 * 60 * 24
    ).encodeABI();


    const txSetting: { [key: string]: any } = {
      value,
      from: this.account.address,
      to: this.dexRouter._address,
      gasPrice: await this.web3.eth.getGasPrice(),
      data,
      nonce: await this.web3.eth.getTransactionCount(this.account.address)
    };

    const gas = await this._estimateGas(txSetting);
    if (!gas) return false;

    const hasGas = await this._hasGas(gas, txSetting);
    if (!hasGas) return false;

    let transaction: any = await this._publishTransaction({
      ...txSetting,
      gas,
    });
    return transaction
  }
}
