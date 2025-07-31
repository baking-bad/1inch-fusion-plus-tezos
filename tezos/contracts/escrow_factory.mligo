#import "common/types.mligo" "Types"
#import "common/errors.mligo" "Errors"
#import "common/tokens.mligo" "Tokens"
#import "escrow_src.mligo" "EscrowSrc"

type storage = unit

type deploy_src = {
  immutables : Types.immutables;
}

[@entry]
let deploy_src 
    ({immutables} : deploy_src) 
    (storage : storage) 
    : operation list * storage =
  // TODO: add signature validation
  let salt = Crypto.keccak (Bytes.pack immutables) in
  let (required_tez_amount, required_token_amount) =  (match immutables.token with
    | TEZ -> (immutables.safety_deposit + immutables.amount, 0n)
    | _ -> (immutables.safety_deposit, immutables.amount)) in
  let tez_amount = Tezos.get_amount () in
  let () = Assert.Error.assert (tez_amount = required_tez_amount * 1mutez) Errors.invalid_transaction_amount in
  let (origination_op, escrow_contract) = EscrowSrc.originate_escrow_src tez_amount { salt } in
  let ops = if required_token_amount = 0n then
    [origination_op]
  else
    [origination_op; Tokens.transfer immutables.token immutables.maker escrow_contract required_token_amount] in
  (ops, storage)
