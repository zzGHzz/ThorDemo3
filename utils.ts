import { cry } from 'thor-devkit'

function buffer2hexstr(b: Buffer): string {
    return '0x' + b.toString('hex');
}

function genPrivateKey(): [string, string] {
    const sk = cry.secp256k1.generatePrivateKey();
    const addr = cry.publicKeyToAddress(cry.secp256k1.derivePublicKey(sk));
    return [buffer2hexstr(sk), buffer2hexstr(addr)];
}

// Generate new accounts
const numKey = 1;
(() => {
    for (let i = 0; i < numKey; i++) {
        let accInfo = genPrivateKey();
        console.log("PrivKey = " + accInfo[0]);
        console.log("Address = " + accInfo[1]);
    }
})()