# Demo Code for Article ["What you might not know about VeChainThor yet (Part III) - Transaction Fee Delegation (VIP-191)"](https://medium.com/@ziheng.zhou/what-you-might-not-know-about-vechainthor-yet-part-iii-transaction-fee-delegation-vip-191-4ee71d690f1b)

## Introduction
This is a demo to demonstrate the TX-fee-delegation mechanism (both VIP-191 and MPP) on VeChainThor. The demo is built using tools [connex-framework](https://github.com/vechain/connex-framework) and [connex.driver-nodejs](https://github.com/vechain/connex.driver-nodejs) that implement the [Connex](https://github.com/vechain/connex) interface in a NodeJS environment.

### Connex Interface for VIP-191
There are two extra things you need to do on top of the normal procedure of constructing a TX using Connex:

1. Create your own function with the following definition:

	`function (unsignedTx: { raw: string, origin: string }): Promise<{ signature: string }>`
	
	This function is typically responsible for passing data to the gas-payer, waiting for its response and returns a `Promise`, if resolved, carrying the gas-payer's signature.
2. Pass the function to the instance of `Connex.Vendor.TxSigningService`, as you've already created for TX construction, via the `delegate` method. For instance, you may add a line such as:

	`signingService.delegate(MyFunc);`

That's it! 

Note that the function I made in the demo code is NOT a typical function you would see in a real application. It is created purely for this demo and should not be considered as an example of creating such a function. 

## Installation
Download the code via

`git clone https://github.com/zzGHzz/ThorDemo3.git`

After that, install all the required packages and you are good to go. 

## Warning
The private keys hard coded in the code are for this demo only. Please avoid using it in any other circumstances. 
