import { AbiCoder, Contract, Wallet, JsonRpcProvider, Signer, type TransactionResponse, parseEther, parseUnits, formatUnits } from 'ethers';

import type { ChainId, Erc20Token, EvmToken } from '../models/index.js';
import ERC20 from '../../../../contracts/evm/compiled/IERC20.sol/IERC20.json' with { type: 'json' };

interface EvmChainAccountOptions {
  privateKeyOrSigner: string | Signer;
  rpcUrl: string;
  chainId: ChainId;
  tokens: Record<string, EvmToken>;
  tokenDonors: Record<string, string>;
}

const coder = AbiCoder.defaultAbiCoder();

export class EvmChainAccount {
  readonly chainId: ChainId;
  readonly provider: JsonRpcProvider;
  readonly signer: Signer;

  protected readonly tokens: Readonly<Record<string, EvmToken>>;
  protected readonly tokenDonors: Readonly<Record<string, string>>;

  constructor(options: EvmChainAccountOptions) {
    this.chainId = options.chainId;
    this.tokens = options.tokens;
    this.tokenDonors = options.tokenDonors;

    this.provider = new JsonRpcProvider(options.rpcUrl, this.chainId, {
      cacheTimeout: -1,
      staticNetwork: true,
    });
    this.signer = typeof options.privateKeyOrSigner === 'string'
      ? new Wallet(options.privateKeyOrSigner, this.provider)
      : options.privateKeyOrSigner;
  }

  async start() {
    for (const donorAddress of Object.values(this.tokenDonors)) {
      await this.provider.send('anvil_impersonateAccount', [donorAddress]);
    }
  }

  async stop() {
  }

  getAddress(): Promise<string> {
    return this.signer.getAddress();
  }

  getToken(tokenSymbol: string): EvmToken | undefined {
    return this.tokens[tokenSymbol.toLowerCase()];
  }

  async getTokenBalance(token: EvmToken, rawFormat: true): Promise<bigint>;
  async getTokenBalance(token: EvmToken, rawFormat: false): Promise<string>;
  async getTokenBalance(token: EvmToken, rawFormat: boolean): Promise<string | bigint> {
    let rawBalance: bigint;
    if (token.type === 'native') {
      rawBalance = await this.provider.getBalance(await this.getAddress());
    }
    else {
      const tokenContract = new Contract(token.address.toString(), ERC20.abi, this.provider);
      rawBalance = await tokenContract.balanceOf!(await this.getAddress());
    }

    return rawFormat ? rawBalance : formatUnits(rawBalance, token.decimals);
  }

  async topUpFromDonor(token: EvmToken, amount: number | string | bigint): Promise<TransactionResponse> {
    const donorAddress = this.tokenDonors[token.symbol.toLowerCase()];
    if (!donorAddress)
      throw new Error(`Donor address for ${token.symbol} token is not specified`);

    const senderAddress = await this.getAddress();

    console.log(senderAddress, ` : Top up ${token.symbol} token from donor ${donorAddress} with amount ${amount}...`);
    const donorSigner = await this.provider.getSigner(donorAddress);
    const rawAmount = this.getRawAmount(amount, token);

    let tx: TransactionResponse;
    if (token.type === 'native') {
      tx = await donorSigner.sendTransaction({
        to: senderAddress,
        value: rawAmount,
      });
    }
    else {
      tx = await donorSigner.sendTransaction({
        to: token.address.toString(),
        data: '0xa9059cbb' + coder.encode(['address', 'uint256'], [senderAddress, rawAmount]).slice(2),
      });
    }

    await tx.wait();

    console.log(senderAddress, ` : Top up completed. TxHash ${tx.hash}`);
    return tx;
  }

  async approveUnlimited(token: Erc20Token, spender: string): Promise<TransactionResponse> {
    const senderAddress = await this.getAddress();

    console.log(senderAddress, ` : Approving unlimited allowance for ${token.symbol} token to ${spender}...`);
    const currentApprove = await this.getAllowance(token, spender);

    // for usdt like tokens
    if (currentApprove !== 0n) {
      await this.approveToken(token, spender, 0n);
    }

    const tx = await this.approveToken(token, spender, (1n << 256n) - 1n);
    console.log(senderAddress, ` : Unlimited allowance approved for ${token.symbol} token to ${spender}`);

    return tx;
  }

  async getAllowance(token: Erc20Token, spender: string): Promise<bigint> {
    const contract = new Contract(token.address, ERC20.abi, this.provider);

    return contract.allowance!(await this.getAddress(), spender);
  }

  async transferToken(token: EvmToken, dest: string, amount: number | string | bigint): Promise<TransactionResponse> {
    const rawAmount = parseEther(amount.toString());
    if (token.type === 'native') {
      return await this.signer.sendTransaction({
        to: dest,
        value: rawAmount,
      });
    }

    const tx = await this.signer.sendTransaction({
      to: token.address,
      data: '0xa9059cbb' + coder.encode(['address', 'uint256'], [dest, rawAmount]).slice(2),
    });

    await tx.wait();
    return tx;
  }

  async approveToken(token: Erc20Token, spender: string, amount: number | string | bigint): Promise<TransactionResponse> {
    const rawAmount = this.getRawAmount(amount, token);
    const tx = await this.signer.sendTransaction({
      to: token.address,
      data: '0x095ea7b3' + coder.encode(['address', 'uint256'], [spender, rawAmount]).slice(2),
    });

    await tx.wait();
    return tx;
  }

  private getRawAmount(amount: number | string | bigint, token: EvmToken): bigint {
    return typeof amount === 'bigint' ? amount : parseUnits(amount.toString(), token.decimals);
  }
}
