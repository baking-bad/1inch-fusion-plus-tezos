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

type factory_timelocks = {
  src_withdrawal : int;
  src_public_withdrawal : int;
  src_cancellation : int;
  src_public_cancellation : int;
  dst_withdrawal : int;
  dst_public_withdrawal : int;
  dst_cancellation : int;
}

type factory_immutables = {
  order_hash : bytes;
  hashlock : bytes;
  maker : address;
  taker : address;
  token : token;
  amount : nat;
  safety_deposit : tez;
  timelocks : factory_timelocks;
}

type order = {
  maker : key;
  token : token;
  amount : nat;
  order_hash : bytes;
  hashlock : bytes;
}

type partial_immutables = {
  taker : address;
  safety_deposit : tez;
  timelocks : factory_timelocks;
}
