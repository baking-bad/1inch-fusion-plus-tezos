#import "common/types.mligo" "Types"
#import "common/errors.mligo" "Errors"
#import "common/tokens.mligo" "Tokens"
#import "common/validation.mligo" "Validation"
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
  let () = Validation.assert_safety_deposit_in_transaction immutables in
  let (origination_op, escrow_contract) = 
    EscrowSrc.originate_escrow_src immutables.safety_deposit { immutables } in
  let ops = [
    origination_op;
    Tokens.transfer_fa immutables.token immutables.maker escrow_contract immutables.amount;
  ] in
  (ops, storage)
