import { ContractFactory, Signer } from 'ethers';

export const deploy = async (
  json: { abi: any; bytecode: any },
  params: unknown[],
  deployer: Signer
): Promise<string> => {
  const deployed = await new ContractFactory(json.abi, json.bytecode, deployer)
    .deploy(...params);
  await deployed.waitForDeployment();

  return await deployed.getAddress();
};
