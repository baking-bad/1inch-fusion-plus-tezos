import { keccak256 } from 'ethers';

export const mapTezosAddressToEvmAddress = (tezosAddress: string): string => {
  const hash = keccak256(Buffer.from(tezosAddress));
  return '0x' + hash.slice(-40);
};

export const mapTezosTokenAddressToEvmAddress = (tezosTokenAddress: string, tokenId?: string): string => {
  return mapTezosAddressToEvmAddress(`${tezosTokenAddress}${tokenId ? `:${tokenId}` : ''}`);
};
