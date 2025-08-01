#import "common/errors.mligo" "Errors"
#import "common/validation.mligo" "Validation"
#import "common/tokens.mligo" "Tokens"
#import "common/types.mligo" "Types"

type storage = { 
  immutables : Types.immutables;
}

type withdraw = { 
  secret : bytes;
}

type withdraw_to = { 
  secret : bytes;
  target : address;
}

type parameter =
  | Withdraw of withdraw
  | WithdrawTo of withdraw_to
  | PublicWithdraw of withdraw
  | Cancel
  | PublicCancel

type result = operation list * storage

[@inline]
let _withdraw_to 
    (secret : bytes)
    (target: address) 
    (immutables : Types.immutables)
    : operation list =
  let () = Validation.assert_valid_secret secret immutables.hashlock in
  [
    Tokens.transfer immutables.token (Tezos.get_self_address ()) target immutables.amount;
    Tokens.transfer_tez (Tezos.get_sender ()) immutables.safety_deposit
  ]

let withdraw 
    ({secret} : withdraw) 
    ({immutables} : storage) 
    : operation list =
  let () = Validation.assert_only_taker immutables in
  let () = Validation.assert_only_after immutables.timelocks.src_withdrawal in
  let () = Validation.assert_only_before immutables.timelocks.src_cancellation in
  _withdraw_to secret (Tezos.get_sender ()) immutables

let withdraw_to
    ({secret; target} : withdraw_to) 
    ({immutables} : storage) 
    : operation list =
  let () = Validation.assert_only_taker immutables in
  let () = Validation.assert_only_after immutables.timelocks.src_withdrawal in
  let () = Validation.assert_only_before immutables.timelocks.src_cancellation in
  _withdraw_to secret target immutables

let public_withdraw
    ({secret} : withdraw)
    ({immutables} : storage)
    : operation list =
  let () = Validation.assert_only_after immutables.timelocks.src_public_withdrawal in
  let () = Validation.assert_only_before immutables.timelocks.src_cancellation in
  _withdraw_to secret immutables.taker immutables

[@inline]
let _cancel
    (immutables : Types.immutables)
    : operation list =
  [
    Tokens.transfer immutables.token (Tezos.get_self_address ()) immutables.maker immutables.amount;
    Tokens.transfer_tez (Tezos.get_sender ()) immutables.safety_deposit
  ]

let cancel
    ({immutables} : storage)
    : operation list =
  let () = Validation.assert_only_taker immutables in
  let () = Validation.assert_only_after immutables.timelocks.src_cancellation in
  _cancel immutables

let public_cancel
    ({immutables} : storage)
    : operation list =
  let () = Validation.assert_only_after immutables.timelocks.src_public_cancellation in
  _cancel immutables

[@entry] 
let main (param : parameter) (storage : storage) : result =
  let () = Validation.assert_no_tez_in_transaction () in
  match param with
    | Withdraw param -> (withdraw param storage, storage)
    | WithdrawTo param -> (withdraw_to param storage, storage)
    | PublicWithdraw param -> (public_withdraw param storage, storage)
    | Cancel -> (cancel storage, storage)
    | PublicCancel -> (public_cancel storage, storage)


let originate_escrow_src
    (amount : tez) 
    (storage : storage)
    : operation * address = 
  Tezos.Next.Operation.create_contract main None amount storage
