# Wrapped FIL + Foundry/Hardhat FEVM template

This repo is meant to serve as an example of how to:

- Use Foundry to test your smart contracts at lightning speed
- GitHub action to run your test cases in a private network
- Use Hardhat to deploy your smart contracts and interact with it

## Set up

Make sure you have installed:

[Foundry](https://github.com/foundry-rs/foundry)<br />

```
git clone https://github.com/banyancomputer/figswap-contracts
cd figswap-contracts
npm i
```

Then, do

```
npx hardhat deploy
```

Repeat this next on the contracts folder, and (in the future) on the contracts-staking folder.

## Testing your contracts with forge

`forge test`

## Deploy your contracts to Wallaby with hardhat

1. Import a private key into your `hardhat.config.ts` file
2. Run `npx hardhat get-addrs` to get your addresses. NOTE - if you see an `actor not found` error, this means that you need to visit the [Wallaby faucet](https://wallaby.network/#faucet) and bless yourself with some funds.
3. Deploy your contracts to wallaby via: `npm run deploy` (note, if you see an error about "please check your node synced status", it's likely the network has reset since you last deployed. Please delete the `deployments` directory and try again.)
4. Try out some tasks!:

```
npx hardhat name --contract <0x-contract-address>
npx hardhat deposit --contract <0x-contract-address> --amount <amount-in-eth>
npx hardhat balanceOf --contract <0x-contract-address> --actor <actor-id-hex>
```
