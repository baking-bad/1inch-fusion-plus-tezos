type fa_token = 
  | FA12 of address
  | FA2 of address * nat

type token =
  | FA of fa_token
  | TEZ

type timelocks = {
  src_withdrawal : timestamp;
  src_public_withdrawal : timestamp;
  src_cancellation : timestamp;
  src_public_cancellation : timestamp;
  dst_withdrawal : timestamp;
  dst_public_withdrawal : timestamp;
  dst_cancellation : timestamp;
}

type immutables = {
  order_hash : bytes;
  hashlock : bytes;
  maker : address;
  taker : address;
  token : token;
  amount : nat;
  safety_deposit : tez;
  timelocks : timelocks;
}

type order = {
  salt: nat;
  maker: bytes;
  receiver: bytes;
  maker_asset: bytes;
  taker_asset: bytes;
  making_amount: nat;
  taking_amount: nat;
  maker_traits: nat;
}
