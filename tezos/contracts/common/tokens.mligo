#import "types.mligo" "Types"

[@inline]
let transfer_tez (to_ : address) (amount : tez) : operation =
  let contract = (Tezos.get_contract to_ : unit contract) in
  Tezos.Next.Operation.transaction () amount contract

type fa12_transfer = {
  [@annot:from] 
  from_ : address; 
  [@annot:to] 
  to_ : address; 
  value : nat 
}

[@inline]
let transfer_fa12 (token : address) (from_ : address) (to_ : address) (value : nat) : operation =
  let contract = (Tezos.get_entrypoint "%transfer" token : fa12_transfer contract) in
  Tezos.Next.Operation.transaction { from_; to_; value } 0mutez contract

type fa2_transfer_destination = {
  [@annot:to]
  to_ : address;
  token_id : nat;
  amount : nat;
}

type fa2_transfer_tx = {
  [@annot:from]
  from_ : address;
  txs : fa2_transfer_destination list;
}

type fa2_transfer_param = fa2_transfer_tx list

[@inline]
let transfer_fa2 (token : address) (token_id : nat) (from_ : address) (to_ : address) (amount : nat) : operation =
  let contract = (Tezos.get_entrypoint "%transfer" token : fa2_transfer_param contract) in
  let transfer_call : fa2_transfer_param = [{
    from_ = from_;
    txs = [{ to_ = to_; token_id = token_id; amount = amount }];
  }] in
  Tezos.Next.Operation.transaction transfer_call 0mutez contract

[@inline]
let transfer_fa (token : Types.fa_token) (from_ : address) (to_ : address) (amount : nat) : operation =
  match token with
  | FA12 addr -> transfer_fa12 addr from_ to_ amount
  | FA2 (addr, token_id) -> transfer_fa2 addr token_id from_ to_ amount

[@inline]
let transfer (token : Types.token) (from_ : address) (to_ : address) (amount : nat) : operation =
  match token with
  | FA fa_token -> transfer_fa fa_token from_ to_ amount
  | TEZ -> transfer_tez to_ (amount * 1mutez)
