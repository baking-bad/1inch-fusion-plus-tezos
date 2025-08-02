import dotenv from 'dotenv';
dotenv.config();
import { TezosToolkit, MichelCodecPacker, OriginateParams, MichelsonMap } from '@taquito/taquito';
import { InMemorySigner } from '@taquito/signer';
import fs from 'fs';
import { METHODS } from 'http';

const RPC_URL = 'https://rpc.ghostnet.teztnets.com';
const ORIGINATOR_PRIVATE_KEY = process.env.ORIGINATOR_PRIVATE_KEY!;

const initToolkit = async () => {
  const toolkit = new TezosToolkit(RPC_URL);
  toolkit.setSignerProvider(await InMemorySigner.fromSecretKey(ORIGINATOR_PRIVATE_KEY));
  toolkit.setPackerProvider(new MichelCodecPacker());

  return toolkit;
};

const originateEscrowFactory = async (toolkit: TezosToolkit) => {
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
  } catch (err) {
    console.error('Error deploying contract:', err);
  }
};

const originateFa12 = async (toolkit: TezosToolkit) => {
  const fa12Code = fs.readFileSync('../compiled/fa12.tz', 'utf8');

  const originator = await toolkit.signer.publicKeyHash();
  const initialBalance = 100_000_000_000;

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
  } catch (err) {
    console.error('Error deploying FA1.2 contract:', err);
  }
};

const originateFa2 = async (toolkit: TezosToolkit) => {
  const fa2Code = fs.readFileSync('../compiled/fa2.tz', 'utf8');
  const originator = await toolkit.signer.publicKeyHash();
  const tokenId = 1;
  const initialBalance = 100_000_000_000;

  const fa2InitialStorage = {
    account_info: MichelsonMap.fromLiteral({
      [originator]: {
        balances: MichelsonMap.fromLiteral({
          [tokenId]: initialBalance
        }),
        updated: Date.now(),
        permits: [],
      }
    }),
    metadata: new MichelsonMap(),
    token_info: MichelsonMap.fromLiteral({
      [tokenId]: initialBalance,
    }),
    token_metadata: MichelsonMap.fromLiteral({
      [tokenId]: {
        token_id: tokenId,
        token_info: new MichelsonMap()
      }
    }),
    minters: [originator],
    admin: originator,
    last_token_id: tokenId,
  };

  try {
    const op = await toolkit.contract.originate({
      code: fa2Code,
      storage: fa2InitialStorage,
    });

    console.log('awaiting confirmation for FA2...');
    await op.confirmation();

    console.log(`fa2 contract address: ${op.contractAddress}`);
  } catch (err) {
    console.error('Error deploying FA2 contract:', err);
  }
};

const main = async () => {
  const toolkit = await initToolkit();
  await originateEscrowFactory(toolkit);
  await originateFa12(toolkit);
  await originateFa2(toolkit);
};

main();
