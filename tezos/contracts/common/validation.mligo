#import "errors.mligo" "Errors"
#import "types.mligo" "Types"

[@inline]
let assert_no_tez_in_transaction
    (_ : unit)
    : unit =
  Assert.Error.assert (Tezos.get_amount () = 0mutez) Errors.tez_in_transaction_disallowed 

[@inline]
let assert_only_taker
    (immutables : Types.immutables)
    : unit =
  Assert.Error.assert (Tezos.get_sender () = immutables.taker) Errors.only_taker

[@inline]
let assert_valid_immutables
    (immutables : Types.immutables)
    (salt : bytes)
    : unit =
  let immutables_hash = Crypto.keccak (Bytes.pack immutables) in
  Assert.Error.assert (immutables_hash = salt) Errors.invalid_immutables

[@inline]
let assert_valid_secret
    (secret : bytes)
    (hashlock : bytes)
    : unit =
  let secret_hash = Crypto.keccak secret in
  Assert.Error.assert (secret_hash = hashlock) Errors.invalid_secret

[@inline]
let assert_only_after
    (timestamp : timestamp)
    : unit =
  let current_time = Tezos.get_now () in
  Assert.Error.assert (current_time >= timestamp) Errors.invalid_time

[@inline]
let assert_only_before
    (timestamp : timestamp)
    : unit =
  let current_time = Tezos.get_now () in
  Assert.Error.assert (current_time < timestamp) Errors.invalid_time

[@inline]
let assert_tez_in_transaction
    (required_amount : tez)
    : unit =
  Assert.Error.assert 
    (Tezos.get_amount () = required_amount) 
    Errors.invalid_tez_amount_in_transaction

[@inline]
let hash_order (order : Types.order) : bytes =
  Crypto.keccak (Bytes.pack order)
