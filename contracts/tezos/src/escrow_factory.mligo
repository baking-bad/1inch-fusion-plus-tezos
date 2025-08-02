#import "common/types.mligo" "Types"
#import "common/errors.mligo" "Errors"
#import "common/tokens.mligo" "Tokens"
#import "common/validation.mligo" "Validation"
#import "escrow_src.mligo" "EscrowSrc"
#import "escrow_dst.mligo" "EscrowDst"

type storage = {
  hashlocks : bytes set; // To not allow reusing hashlocks
  allowed_operators : address set;
  admin: address;
}

type deploy_src = {
  order: Types.order;
  signature: signature;
  partial_immutables : Types.partial_immutables;
}

type deploy_dst = {
  immutables : Types.factory_immutables;
}

let map_timelocks
    (timelocks : Types.factory_timelocks) : Types.timelocks =
    let current_time = Tezos.get_now () in
  {
    src_withdrawal = current_time + timelocks.src_withdrawal;
    src_public_withdrawal = current_time + timelocks.src_public_withdrawal;
    src_cancellation = current_time + timelocks.src_cancellation;
    src_public_cancellation = current_time + timelocks.src_public_cancellation;
    dst_withdrawal = current_time + timelocks.dst_withdrawal;
    dst_public_withdrawal = current_time + timelocks.dst_public_withdrawal;
    dst_cancellation = current_time + timelocks.dst_cancellation;
  }

let map_immutables
    (immutables : Types.factory_immutables) 
    : Types.immutables =
  {
    order_hash = immutables.order_hash;
    hashlock = immutables.hashlock;
    maker = immutables.maker;
    taker = immutables.taker;
    token = immutables.token;
    amount = immutables.amount;
    safety_deposit = immutables.safety_deposit;
    timelocks = map_timelocks immutables.timelocks;
  }

let key_to_address (k: key): address =
  let kh: key_hash = Crypto.hash_key k in
  Tezos.address (Tezos.implicit_account kh)

let map_partial_immutables
    (partial_immutables : Types.partial_immutables)
    (order : Types.order)
    : Types.immutables =
  {
    maker = key_to_address order.maker;
    token = order.token;
    amount = order.amount;
    order_hash = order.order_hash;
    hashlock = order.hashlock;
    taker = partial_immutables.taker;
    safety_deposit = partial_immutables.safety_deposit;
    timelocks = map_timelocks partial_immutables.timelocks;
  }

[@entry]
let deploy_src 
    ({order; signature; partial_immutables = immutables} : deploy_src) 
    (storage : storage) 
    : operation list * storage =
  let () = Validation.assert_valid_order order signature in
  let () = Validation.assert_tez_in_transaction immutables.safety_deposit in
  let filled_immutables = map_partial_immutables immutables order in
  let (origination_op, escrow_contract) = 
    EscrowSrc.originate_escrow_src immutables.safety_deposit { immutables = filled_immutables } in
  let ops = [
    origination_op;
    match filled_immutables.token with
      | FA fa_token -> Tokens.transfer_fa fa_token filled_immutables.maker escrow_contract filled_immutables.amount
      | TEZ -> failwith Errors.invalid_token_type
  ] in
  (ops, storage)


[@entry]
let deploy_dst 
    ({immutables} : deploy_dst) 
    (storage : storage) 
    : operation list * storage =
  let tez_amount = immutables.safety_deposit + (match immutables.token with
    | FA _ -> 0mutez
    | TEZ -> immutables.amount * 1mutez) in
  let () = Validation.assert_tez_in_transaction tez_amount in
  let (origination_op, escrow_contract) = 
    EscrowDst.originate_escrow_dst tez_amount { immutables = map_immutables immutables } in
  let ops = (match immutables.token with
    | FA fa_token -> [ origination_op; Tokens.transfer_fa fa_token immutables.taker escrow_contract immutables.amount ]
    | TEZ -> [ origination_op ]) in
  (ops, storage)
