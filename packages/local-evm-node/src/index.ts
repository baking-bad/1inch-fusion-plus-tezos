import { parseEther } from 'ethers';
import { createServer } from 'prool';
import { anvil } from 'prool/instances';

import config from './config.js';
import { ethereumTokenDonors, ethereumTokens, EvmChainAccount, evmChainHelpers, protocolConfig } from '@baking-bad/1inch-fusion-plus-common';

import factoryContract from '../../../contracts/evm/compiled/TestEscrowFactory.sol/TestEscrowFactory.json' with { type: 'json' };
import resolverContract from '../../../contracts/evm/compiled/Resolver.sol/Resolver.json' with { type: 'json' };

try {
  console.log('Starting local EVM node...');
  const node = createServer({
    instance: anvil({ forkUrl: config.chain.rpcUrl, chainId: config.chain.chainId }),
    port: config.server.port,
    limit: 1,
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received. Cleaning up...');
    await node.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Cleaning up...');
    await node.stop();
    process.exit(0);
  });

  await node.start();
  console.log(`Local EVM node started on port ${config.server.port}`);
  const localRpcUrl = `http://localhost:${config.server.port}/1`;

  const wallet = new EvmChainAccount({
    privateKeyOrSigner: config.chain.deployerPrivateKey,
    rpcUrl: localRpcUrl,
    chainId: config.chain.chainId,
    tokens: ethereumTokens,
    tokenDonors: ethereumTokenDonors,
  });
  await wallet.start();
  console.log('Deployer address:', await wallet.getAddress());
  await wallet.topUpFromDonor(parseEther('10'));

  console.log('Deploying escrow factory...');

  const escrowFactoryAddress = await evmChainHelpers.deploy(
    factoryContract,
    [
      protocolConfig.ethereum.limitOrderProtocolContractAddress,
      protocolConfig.ethereum.wrappedNativeContractAddress,
      '0x0000000000000000000000000000000000000000', // accessToken,
      await wallet.getAddress(), // owner
      60 * 30, // src rescue delay
      60 * 30, // dst rescue delay
    ],
    wallet.signer
  );
  console.log(`Escrow factory deployed at: ${escrowFactoryAddress}`);

  console.log('Deploying resolver contract...');
  const resolverAddress = await evmChainHelpers.deploy(
    resolverContract,
    [
      escrowFactoryAddress,
      protocolConfig.ethereum.limitOrderProtocolContractAddress,
      config.chain.resolverOwnerAddress,
    ],
    wallet.signer
  );
  console.log(`Resolver contract deployed at: ${resolverAddress}`);
  console.log('Local EVM node is ready');
  console.log('You can now use the following RPC URL:', localRpcUrl);
  console.log('');
}
catch (error) {
  console.error('The app crashed:', error);
  process.exit(1);
}
