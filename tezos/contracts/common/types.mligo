type token = 
  | TEZ
  | FA12 of address
  | FA2 of address * nat

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
  safety_deposit : nat;
  timelocks : timelocks;
}
