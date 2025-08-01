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

type parameter =
  | Withdraw of withdraw
  | PublicWithdraw of withdraw
  | Cancel

type result = operation list * storage

[@inline]
let _withdraw_to
    (secret : bytes) 
    (immutables : Types.immutables)
    : operation list =
  let () = Validation.assert_valid_secret secret immutables.hashlock in
  [
    Tokens.transfer immutables.token (Tezos.get_self_address ()) immutables.maker immutables.amount;
    Tokens.transfer_tez (Tezos.get_sender ()) immutables.safety_deposit
  ]

let withdraw 
    ({secret} : withdraw) 
    ({immutables} : storage) 
    : operation list =
  let () = Validation.assert_only_taker immutables in
  let () = Validation.assert_only_after immutables.timelocks.dst_withdrawal in
  let () = Validation.assert_only_before immutables.timelocks.dst_cancellation in
  _withdraw_to secret immutables

let public_withdraw
    ({secret} : withdraw)
    ({immutables} : storage)
    : operation list =
  let () = Validation.assert_only_after immutables.timelocks.dst_public_withdrawal in
  let () = Validation.assert_only_before immutables.timelocks.dst_cancellation in
  _withdraw_to secret immutables

let cancel
    ({immutables} : storage)
    : operation list =
  let () = Validation.assert_only_taker immutables in
  let () = Validation.assert_only_after immutables.timelocks.dst_cancellation in
  [
    Tokens.transfer immutables.token (Tezos.get_self_address ()) immutables.taker immutables.amount;
    Tokens.transfer_tez (Tezos.get_sender ()) immutables.safety_deposit
  ]

[@entry] 
let main (param : parameter) (storage : storage) : result =
  let () = Validation.assert_no_tez_in_transaction () in
  match param with
    | Withdraw param -> (withdraw param storage, storage)
    | PublicWithdraw param -> (public_withdraw param storage, storage)
    | Cancel -> (cancel storage, storage)

let originate_escrow_dst
    (amount : tez) 
    (storage : storage)
    : operation * address = 
  Tezos.Next.Operation.create_contract main None amount storage
