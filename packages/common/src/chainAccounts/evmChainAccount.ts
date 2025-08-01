import { AbiCoder, Contract, Wallet, JsonRpcProvider, Signer } from 'ethers';

import type { Erc20Token } from '../models/index.js';
import ERC20 from '../../../../contracts/evm/compiled/IERC20.sol/IERC20.json' with { type: 'json' };

interface EvmChainAccountOptions {
  userPrivateKey: string;
  rpcUrl: string;
  chainId: number;
  tokens: ReadonlyMap<string, Erc20Token>;
  donorTokenAddresses: ReadonlyMap<string, string>;
}

const coder = AbiCoder.defaultAbiCoder();

export class EvmChainAccount {
  readonly chainId: number;
  readonly provider: JsonRpcProvider;
  readonly signer: Signer;

  protected readonly tokens: ReadonlyMap<string, Erc20Token>;
  protected readonly donorTokenAddresses: ReadonlyMap<string, string>;

  constructor(options: EvmChainAccountOptions) {
    this.chainId = options.chainId;
    this.tokens = options.tokens;
    this.donorTokenAddresses = options.donorTokenAddresses;

    this.provider = new JsonRpcProvider(options.rpcUrl, this.chainId, {
      cacheTimeout: -1,
      staticNetwork: true,
    });
    this.signer = new Wallet(options.userPrivateKey, this.provider);
  }

  async start() {
    for (const donorAddress of this.donorTokenAddresses.values()) {
      await this.provider.send('anvil_impersonateAccount', [donorAddress]);
    }
  }

  async stop() {
  }

  getAddress(): Promise<string> {
    return this.signer.getAddress();
  }

  getToken(tokenSymbol: string): Erc20Token | undefined {
    return this.tokens.get(tokenSymbol.toLowerCase());
  }

  async getTokenBalance(tokenAddress: string): Promise<bigint> {
    const tokenContract = new Contract(tokenAddress.toString(), ERC20.abi, this.provider);

    return tokenContract.balanceOf!(await this.getAddress());
  }

  async topUpFromDonor(tokenAddress: string, amount: bigint): Promise<void> {
    const donorAddress = this.donorTokenAddresses.get(tokenAddress);
    if (!donorAddress)
      throw new Error(`Donor address for token ${tokenAddress} is not specified`);

    console.log(`Top up ${tokenAddress} from donor ${donorAddress} with amount ${amount}...`);

    const donorSigner = await this.provider.getSigner(donorAddress);
    const tx = await donorSigner.sendTransaction({
      to: tokenAddress.toString(),
      data: '0xa9059cbb' + coder.encode(['address', 'uint256'], [await this.getAddress(), amount]).slice(2),
    });

    await tx.wait();

    console.log(`Top up completed: ${tx.hash}`);
  }

  async approveUnlimited(tokenAddress: string, spender: string): Promise<void> {
    const currentApprove = await this.getAllowance(tokenAddress, spender);

    // for usdt like tokens
    if (currentApprove !== 0n) {
      await this.approveToken(tokenAddress, spender, 0n);
    }

    await this.approveToken(tokenAddress, spender, (1n << 256n) - 1n);
  }

  async getAllowance(token: string, spender: string): Promise<bigint> {
    const contract = new Contract(token.toString(), ERC20.abi, this.provider);

    return contract.allowance!(await this.getAddress(), spender.toString());
  }

  async transfer(dest: string, amount: bigint): Promise<void> {
    await this.signer.sendTransaction({
      to: dest,
      value: amount,
    });
  }

  async transferToken(token: string, dest: string, amount: bigint): Promise<void> {
    const tx = await this.signer.sendTransaction({
      to: token.toString(),
      data: '0xa9059cbb' + coder.encode(['address', 'uint256'], [dest.toString(), amount]).slice(2),
    });

    await tx.wait();
  }

  async approveToken(token: string, spender: string, amount: bigint): Promise<void> {
    const tx = await this.signer.sendTransaction({
      to: token.toString(),
      data: '0x095ea7b3' + coder.encode(['address', 'uint256'], [spender.toString(), amount]).slice(2),
    });

    await tx.wait();
  }
}
