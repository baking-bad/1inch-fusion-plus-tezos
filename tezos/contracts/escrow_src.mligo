#import "common/errors.mligo" "Errors"
#import "common/validation.mligo" "Validation"
#import "common/tokens.mligo" "Tokens"
#import "common/types.mligo" "Types"

type storage = { 
  salt: bytes; // keccak256 hash of immutables
}

type withdraw = { 
  secret : bytes;
  immutables : Types.immutables;
}

type withdraw_to = { 
  secret : bytes;
  target : address;
  immutables : Types.immutables;
}

type public_withdraw = { 
  secret : bytes;
  immutables : Types.immutables;
}

type parameter =
  | Withdraw of withdraw
  | WithdrawTo of withdraw_to
  | PublicWithdraw of public_withdraw
  | Cancel of Types.immutables
  | PublicCancel of Types.immutables

type result = operation list * storage

[@inline]
let _withdraw_to 
    (secret : bytes)
    (target: address) 
    (immutables : Types.immutables)
    (storage : storage)
    : operation list =
  let () = Validation.assert_valid_immutables immutables storage.salt in
  let () = Validation.assert_valid_secret secret immutables.hashlock in
  [
    Tokens.transfer immutables.token (Tezos.get_self_address ()) target immutables.amount;
    Tokens.transfer_tez (Tezos.get_sender ()) immutables.safety_deposit
  ]

let withdraw 
    ({secret; immutables} : withdraw) 
    (storage : storage) 
    : operation list =
  let () = Validation.assert_only_taker immutables in
  let () = Validation.assert_only_after immutables.timelocks.src_withdrawal in
  let () = Validation.assert_only_before immutables.timelocks.src_cancellation in
  _withdraw_to secret (Tezos.get_sender ()) immutables storage

let withdraw_to
    ({secret; target; immutables} : withdraw_to) 
    (storage : storage) 
    : operation list =
  let () = Validation.assert_only_taker immutables in
  let () = Validation.assert_only_after immutables.timelocks.src_withdrawal in
  let () = Validation.assert_only_before immutables.timelocks.src_cancellation in
  _withdraw_to secret target immutables storage

let public_withdraw 
    ({secret; immutables} : public_withdraw) 
    (storage : storage) 
    : operation list =
  let () = Validation.assert_only_after immutables.timelocks.src_public_withdrawal in
  let () = Validation.assert_only_before immutables.timelocks.src_cancellation in
  _withdraw_to secret immutables.taker immutables storage

[@inline]
let _cancel
    (immutables : Types.immutables)
    (storage : storage)
    : operation list =
  let () = Validation.assert_valid_immutables immutables storage.salt in
  [
    Tokens.transfer immutables.token (Tezos.get_self_address ()) immutables.maker immutables.amount;
    Tokens.transfer_tez (Tezos.get_sender ()) immutables.safety_deposit
  ]

let cancel 
    (immutables : Types.immutables) 
    (storage : storage) 
    : operation list =
  let () = Validation.assert_only_taker immutables in
  let () = Validation.assert_only_after immutables.timelocks.src_cancellation in
  _cancel immutables storage

let public_cancel
    (immutables : Types.immutables)
    (storage : storage)
    : operation list =
  let () = Validation.assert_only_after immutables.timelocks.src_public_cancellation in
  _cancel immutables storage

[@entry] 
let main (param : parameter) (storage : storage) : result =
  let () = Validation.assert_no_tez_in_transaction () in
  match param with
    | Withdraw param -> (withdraw param storage, storage)
    | WithdrawTo param -> (withdraw_to param storage, storage)
    | PublicWithdraw param -> (public_withdraw param storage, storage)
    | Cancel immutables -> (cancel immutables storage, storage)
    | PublicCancel immutables -> (public_cancel immutables storage, storage)


let originate_escrow_src
    (amount : tez) 
    (storage : storage)
    : operation * address = 
  Tezos.Next.Operation.create_contract main None amount storage
