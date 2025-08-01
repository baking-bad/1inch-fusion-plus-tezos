#import "common/types.mligo" "Types"
#import "common/errors.mligo" "Errors"
#import "common/tokens.mligo" "Tokens"
#import "common/validation.mligo" "Validation"
#import "escrow_src.mligo" "EscrowSrc"
#import "escrow_dst.mligo" "EscrowDst"

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
  let () = Validation.assert_tez_in_transaction immutables.safety_deposit in
  let (origination_op, escrow_contract) = 
    EscrowSrc.originate_escrow_src immutables.safety_deposit { immutables } in
  let ops = [
    origination_op;
    match immutables.token with
      | FA fa_token -> Tokens.transfer_fa fa_token immutables.maker escrow_contract immutables.amount
      | TEZ -> failwith Errors.invalid_token_type
  ] in
  (ops, storage)


[@entry]
let deploy_dst 
    ({immutables} : deploy_src) 
    (storage : storage) 
    : operation list * storage =
  // TODO: add signature validation
  let tez_amount = immutables.safety_deposit + (match immutables.token with
    | FA _ -> 0mutez
    | TEZ -> immutables.amount * 1mutez) in
  let () = Validation.assert_tez_in_transaction tez_amount in
  let (origination_op, escrow_contract) = 
    EscrowDst.originate_escrow_dst tez_amount { immutables } in
  let ops = (match immutables.token with
    | FA fa_token -> [ origination_op; Tokens.transfer_fa fa_token immutables.maker escrow_contract immutables.amount ]
    | TEZ -> [ origination_op ]) in
  (ops, storage)
