import { Framework } from '@vechain/connex-framework'
import { DriverNodeJS } from '@vechain/connex.driver-nodejs'
import { cry } from 'thor-devkit'

function sendDelegatedTX(
    connex: Connex,
    clause: { to: string, value: string, data: string }[],
    addrSender: string,
    skDelegator: string
) {
    const signingService = connex.vendor.sign('tx');
    signingService.signer(addrSender);

    let handler = function (unsignedTx: { raw: string, origin: string }): Promise<{ signature: string }> {
        const hash = cry.blake2b256(Buffer.from(unsignedTx.raw.slice(2), 'hex'));
        const delegatorSigningHash = cry.blake2b256(hash, Buffer.from(unsignedTx.origin.slice(2), 'hex'));
        const sig = cry.secp256k1.sign(delegatorSigningHash, Buffer.from(skDelegator.slice(2), 'hex'));

        return new Promise(resolve => {
            resolve({ signature: '0x' + sig.toString('hex') });
        });
    }
    signingService.delegate(handler);

    return signingService.request(clause);
}

function MPPSetUser(
    connex: Connex,
    delegator: string,
    user: string
) {
    const PROTOTYPE = '0x000000000000000000000050726f746f74797065';
    const abi = {
        "constant": false,
        "inputs": [
            {
                "name": "self",
                "type": "address"
            },
            {
                "name": "user",
                "type": "address"
            }
        ],
        "name": "addUser",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    };
    const method = connex.thor.account(PROTOTYPE).method(abi);
    const clause = method.asClause(delegator.slice(2), user.slice(2));

    const signingService = connex.vendor.sign('tx');
    signingService.signer(delegator).gas(100000);
    return signingService.request([{ ...clause }]);
}

function MPPSetCredit(
    connex: Connex,
    delegator: string,
    credit: string,         // hex string with '0x'
    recoveryRate: string    // hex string with '0x'
) {
    const PROTOTYPE = '0x000000000000000000000050726f746f74797065';
    const abi = {
        "constant": false,
        "inputs": [
            {
                "name": "self",
                "type": "address"
            },
            {
                "name": "credit",
                "type": "uint256"
            },
            {
                "name": "recoveryRate",
                "type": "uint256"
            }
        ],
        "name": "setCreditPlan",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    };
    const method = connex.thor.account(PROTOTYPE).method(abi);
    const clause = method.asClause(delegator.slice(2), credit, recoveryRate);

    const signingService = connex.vendor.sign('tx');
    signingService.signer(delegator).gas(100000);
    return signingService.request([{ ...clause }]);
}

function MPPSendTx(
    connex: Connex,
    user: string,
    clauses: { to: string, value: string, data: string }[]
) {
    const signingService = connex.vendor.sign('tx');
    signingService.signer(user);
    return signingService.request(clauses);
}

function printReceipt(msg: string, receipt: Connex.Thor.Receipt, to: string) {
    console.log('--------------------------')
    console.log(msg);
    console.log('--------------------------')
    console.log('TXID       = ' + receipt.meta.txID);
    console.log('From       = ' + receipt.meta.txOrigin);
    console.log('To         = ' + to)
    console.log('GasPayer   = ' + receipt.gasPayer);
    console.log('GasUsed    = ' + receipt.gasUsed);
    console.log('...')
}

(async () => {
    const driver = await DriverNodeJS.connect("https://sync-testnet.vechain.org");
    const connex = new Framework(driver);
    const ticker = connex.thor.ticker();

    // TX sender
    const skSender = '0x207a28b692c2b1d399d684bf03d635c42fbb333a34fff91cad87f65b0368d982';
    const addrSender = '0xd55100eedb61f1e553a38c33a234ce07952c43f2';
    // TX delegator
    const skDelegator = '0x3c6f1c52984a4d58507ed542689237c01c9a3fcaacc7c3b1b1fbee62910e35f2';
    const addrDelegator = '0xe4660c72dea1d9fc2a0dc2b3a42107d37edc6327';
    // TX recipient
    const addrRecipient = '0x91436f1E5008B2E6093E114A25842F060012685d';

    // Add private keys to wallet for TX signing
    const wallet = driver.wallet;
    wallet.add(skSender);
    wallet.add(skDelegator);

    const clausesVIP191 = [{
        to: addrRecipient,
        value: '0x0',
        data: '0x'
    }];

    const clausesMPP = [{
        to: addrDelegator,
        value: '0x0',
        data: '0x'
    }];

    let ret: any;
    let receipt: Connex.Thor.Receipt;

    /////////////////
    // VIP-191
    /////////////////
    ret = await sendDelegatedTX(connex, clausesVIP191, addrSender, skDelegator);

    for (let i = 0; i < 3; i++) {
        await ticker.next();
        receipt = await connex.thor.transaction(ret.txid).getReceipt();
        if (receipt != null) { break; }
    }
    if (receipt === null) { console.error('Cannot find the TX.'); }

    printReceipt('VIP-191', receipt, addrRecipient);

    ////////////////////
    // MPP - Set user
    ////////////////////
    ret = await MPPSetUser(connex, addrDelegator, addrSender);

    for (let i = 0; i < 3; i++) {
        await ticker.next();
        receipt = await connex.thor.transaction(ret.txid).getReceipt();
        if (receipt != null) { break; }
    }
    if (receipt === null) { console.error('Cannot find the TX.'); }

    printReceipt('MPP - Add User', receipt, '0x000000000000000000000050726f746f74797065');

    ////////////////////
    // MPP - Set credit plan
    ////////////////////
    const credit = '0x' + (5e22).toString(16);
    const recoveryRate = '0x0'
    ret = await MPPSetCredit(connex, addrDelegator, credit, recoveryRate);

    for (let i = 0; i < 3; i++) {
        await ticker.next();
        receipt = await connex.thor.transaction(ret.txid).getReceipt();
        if (receipt != null) { break; }
    }
    if (receipt === null) { console.error('Cannot find the TX.'); }

    printReceipt('MPP - Add Credit Plan', receipt, '0x000000000000000000000050726f746f74797065');

    ////////////////////
    // MPP - Send TX
    ////////////////////
    ret = await MPPSendTx(connex, addrSender, clausesMPP);

    for (let i = 0; i < 3; i++) {
        await ticker.next();
        receipt = await connex.thor.transaction(ret.txid).getReceipt();
        if (receipt != null) { break; }
    }
    if (receipt === null) { console.error('Cannot find the TX.'); }

    printReceipt('MPP - User Sends TX', receipt, addrDelegator);
})();