import dotenv from 'dotenv';
dotenv.config();
import { TezosToolkit, MichelCodecPacker, OriginateParams, MichelsonMap } from '@taquito/taquito';
import { InMemorySigner } from '@taquito/signer';
import fs from 'fs';
import { METHODS } from 'http';

const RPC_URL = 'https://rpc.ghostnet.teztnets.com';
const ORIGINATOR_PRIVATE_KEY = process.env.ORIGINATOR_PRIVATE_KEY!;
const USER_PRIVATE_KEY = process.env.USER_PRIVATE_KEY!;
const RESOLVER_PRIVATE_KEY = process.env.RESOLVER_PRIVATE_KEY!;
const fa2TokenId = 1;

const initToolkit = async (privateKey: string) => {
  const toolkit = new TezosToolkit(RPC_URL);
  toolkit.setSignerProvider(await InMemorySigner.fromSecretKey(privateKey));
  toolkit.setPackerProvider(new MichelCodecPacker());

  return toolkit;
};

const originateEscrowFactory = async (toolkit: TezosToolkit): Promise<string> => {
  const code = fs.readFileSync('../compiled/escrow_factory.tz', 'utf8');

  const initialStorage = {
    hashlocks: [],
    allowed_operators: [],
    admin: await toolkit.signer.publicKeyHash()
  };

  try {
    const op = await toolkit.contract.originate({
      code,
      storage: initialStorage,
    });

    console.log('awaiting for confirmation for escrow_factory...');
    await op.confirmation();

    console.log(`escrow_factory address: ${op.contractAddress}`);
    return op.contractAddress!;
  } catch (err) {
    console.error('Error deploying contract:', err);
    throw err;
  }
};

const originateFa12 = async (toolkit: TezosToolkit): Promise<string> => {
  const fa12Code = fs.readFileSync('../compiled/fa12.tz', 'utf8');

  const originator = await toolkit.signer.publicKeyHash();
  const initialBalance = 100_000_000_000_000;

  const fa12InitialStorage = {
    total_supply: initialBalance,
    ledger: {
      [originator]: {
        amount: initialBalance,
        allowances: {}
      }
    },
    admin: originator,
    metadata: MichelsonMap.fromLiteral({})
  };

  try {
    const op = await toolkit.contract.originate({
      code: fa12Code,
      storage: fa12InitialStorage,
    });

    console.log('awaiting confirmation for FA1.2...');
    await op.confirmation();

    console.log(`fa12 contract address: ${op.contractAddress}`);
    return op.contractAddress!;
  } catch (err) {
    console.error('Error deploying FA1.2 contract:', err);
    throw err;
  }
};

const originateFa2 = async (toolkit: TezosToolkit): Promise<string> => {
  const fa2Code = fs.readFileSync('../compiled/fa2.tz', 'utf8');
  const originator = await toolkit.signer.publicKeyHash();
  const initialBalance = 100_000_000_000_000;

  const fa2InitialStorage = {
    account_info: MichelsonMap.fromLiteral({
      [originator]: {
        balances: MichelsonMap.fromLiteral({
          [fa2TokenId]: initialBalance
        }),
        updated: Date.now(),
        permits: [],
      }
    }),
    metadata: new MichelsonMap(),
    token_info: MichelsonMap.fromLiteral({
      [fa2TokenId]: initialBalance,
    }),
    token_metadata: MichelsonMap.fromLiteral({
      [fa2TokenId]: {
        token_id: fa2TokenId,
        token_info: new MichelsonMap()
      }
    }),
    minters: [originator],
    admin: originator,
    last_token_id: fa2TokenId + 1,
  };

  try {
    const op = await toolkit.contract.originate({
      code: fa2Code,
      storage: fa2InitialStorage,
    });

    console.log('awaiting confirmation for FA2...');
    await op.confirmation();

    console.log(`fa2 contract address: ${op.contractAddress}`);
    return op.contractAddress!;
  } catch (err) {
    console.error('Error deploying FA2 contract:', err);
    throw err;
  }
};

const transferFa12 = async (
  senderToolkit: TezosToolkit,
  fa12Address: string, 
  receiver: string, 
  amount: number,
  from?: string
) => {
  const contract = await senderToolkit.contract.at(fa12Address);

  const transferParams = {
    from: from || (await senderToolkit.signer.publicKeyHash()),
    to: receiver,
    value: amount,
  };

  try {
    const transferOp = await contract.methodsObject.transfer(transferParams).send({ amount: 0, mutez: true });
    console.log('awaiting confirmation for FA1.2 transfer...');
    await transferOp.confirmation();

    console.log(`FA1.2 transfer successful: ${transferOp.hash}`);
  } catch (err) {
    console.error('Error transferring FA1.2 tokens:', err);
    throw err;
  }
};

const approveFa12 = async (
  senderToolkit: TezosToolkit,
  fa12Address: string,
  spender: string,
  amount: number) => {
  const contract = await senderToolkit.contract.at(fa12Address);
  const approveParams = {
    spender,
    value: amount,
  };
  try {
    const approveOp = await contract.methodsObject.approve(approveParams).send({ amount: 0, mutez: true });
    console.log('awaiting confirmation for FA1.2 approve...');
    await approveOp.confirmation();

    console.log(`FA1.2 approve successful: ${approveOp.hash}`);
  } catch (err) {
    console.error('Error approving FA1.2 tokens:', err);
    throw err;
  }
};

const transferFa2 = async (
  senderToolkit: TezosToolkit,
  fa2Address: string,
  tokenId: number,
  receiver: string,
  amount: number,
  from?: string
) => {
  const contract = await senderToolkit.contract.at(fa2Address);

  const transferParams = [{
    from_: from || (await senderToolkit.signer.publicKeyHash()),
    txs: [{
      to_: receiver,
      token_id: tokenId,
      amount,
    }],
  }];

  try {
    const transferOp = await contract.methodsObject.transfer(transferParams).send({ amount: 0, mutez: true });
    console.log('awaiting confirmation for FA2 transfer...');
    await transferOp.confirmation();

    console.log(`FA2 transfer successful: ${transferOp.hash}`);
  } catch (err) {
    console.error('Error transferring FA2 tokens:', err);
    throw err;
  }
};

const approveFa2 = async (
  senderToolkit: TezosToolkit,
  fa2Address: string,
  tokenId: number,
  spender: string) => {
  const contract = await senderToolkit.contract.at(fa2Address);
  const approveParams = {
    owner: await senderToolkit.signer.publicKeyHash(),
    operator: spender,
    token_id: tokenId,
  };
  try {
    const approveOp = await contract.methodsObject.update_operators([{
      add_operator: approveParams,
    }]).send({ amount: 0, mutez: true });
    console.log('awaiting confirmation for FA2 approve...');
    await approveOp.confirmation();

    console.log(`FA2 approve successful: ${approveOp.hash}`);
  } catch (err) {
    console.error('Error approving FA2 tokens:', err);
    throw err;
  }
};

const main = async () => {
  const originatorToolkit = await initToolkit(ORIGINATOR_PRIVATE_KEY);
  const userToolkit = await initToolkit(USER_PRIVATE_KEY);
  const resolverToolkit = await initToolkit(RESOLVER_PRIVATE_KEY);

  const escrowFactoryAddress = await originateEscrowFactory(originatorToolkit);
  const fa12Address = await originateFa12(originatorToolkit);
  const fa2Address = await originateFa2(originatorToolkit);

  const init_balance = 100_000_000_000;
  await transferFa12(originatorToolkit, fa12Address, await userToolkit.signer.publicKeyHash(), init_balance);
  await transferFa12(originatorToolkit, fa12Address, await resolverToolkit.signer.publicKeyHash(), init_balance);
  await approveFa12(userToolkit, fa12Address, escrowFactoryAddress, init_balance);
  await approveFa12(resolverToolkit, fa12Address, escrowFactoryAddress, init_balance);

  await transferFa2(originatorToolkit, fa2Address, fa2TokenId, await userToolkit.signer.publicKeyHash(), init_balance);
  await transferFa2(originatorToolkit, fa2Address, fa2TokenId, await resolverToolkit.signer.publicKeyHash(), init_balance);
  await approveFa2(userToolkit, fa2Address, fa2TokenId, escrowFactoryAddress);
  await approveFa2(resolverToolkit, fa2Address, fa2TokenId, escrowFactoryAddress);
};

main();
