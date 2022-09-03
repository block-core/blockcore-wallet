import * as secp from '@noble/secp256k1';
import { HDKey } from '@scure/bip32';
import { mnemonicToSeedSync } from '@scure/bip39';
import { CryptoService, CryptoUtility } from 'src/app/services';
import { STRAX } from 'src/shared/networks';
import {
  AddressState,
  Transaction,
  IndexerBackgroundService,
  WalletStore,
  Persisted,
  TransactionStore,
} from '.';
import { AddressManager } from './address-manager';
import { Wallet } from './interfaces';
import { AccountHistoryStore, SettingStore } from './store';
import { AddressStore } from './store/address-store';
import { NetworkLoader } from './network-loader';

describe('SharedTests', () => {
  beforeEach(() => {});

  // it('Validate the StateStore', async () => {
  //     const stateStore = new StateStore();

  //     const data1 = await stateStore.get('key1');
  //     expect(data1).toBeUndefined();

  //     const state: Persisted = {
  //         previousWalletId: '',
  //         wallets: JSON.parse(testWallet)
  //     };

  //     await stateStore.set('state', state);

  //     const retrievedState = await stateStore.get<any>('state');

  //     // Perform a deep scan between the instances:
  //     expect(state).toEqual(retrievedState);

  //     await stateStore.remove('state');

  //     const data2 = await stateStore.get('state');
  //     expect(data2).toBeUndefined();
  // });

  function sortHistory(a: any, b: any) {
    let index1 = a.blockIndex;
    let index2 = b.blockIndex;

    if (index1 == 0) index1 = 9007199254740991;
    if (index2 == 0) index2 = 9007199254740991;

    if (index1 < index2) return 1;
    if (index1 > index2) return -1;
    return 0;
  }

  it('Sum values in array', () => {
    const outputs = [5000, 0, null];

    if (outputs.length > 0) {
      console.log('OUTPUTS', outputs);
      let amount = outputs.reduce((x: any, y: any) => x + y);
      expect(amount).toBe(5000);
    }
  });

  // it('Sum values and reproduce bug', () => {

  //     const externalOutputs = [{ balance: 5000 }, { balance: null }, { balance: undefined }];
  //     const outputs = externalOutputs.map(x => x.balance);
  //     // const outputs = [5000, 0, null];

  //     if (outputs.length > 0) {
  //         console.log('OUTPUTS', outputs);
  //         let amount = outputs.reduce((x: any, y: any) => x + y);
  //         expect(amount).toBe(5000);
  //     }

  // });

  it('Validate sorting', () => {
    const array = `[{"blockIndex":953430,"unconfirmed":false,"finalized":false,"transactionHash":"0409a02e52be0e2d14da6cebfd78641f3a68a3ee3c187b91cbb9da1b5d0b596c","timestamp":1647639600,"isCoinstake":false,"isCoinbase":false,"fee":10000,"entryType":"send","calculatedValue":200000000,"calculatedAddress":"qd11oyjzWZxNV85kXwC2KstgYh588YzEJE"},{"blockIndex":953427,"unconfirmed":false,"finalized":false,"transactionHash":"c9a42f10a1a1f84806e29c6b556866a3f50caf5e3de7327738562762f90b2864","timestamp":1647639440,"isCoinstake":false,"isCoinbase":false,"fee":10000,"entryType":"receive","calculatedValue":100000000,"calculatedAddress":"qVQisdLYduJ2Cpkq6oG7pgfnXMRzyNW7EQ"},{"blockIndex":953413,"unconfirmed":false,"finalized":false,"transactionHash":"209caa667e17dfea054f5167461b9330ab75e7feeb7794dba155450247fd64c2","timestamp":1647638704,"isCoinstake":false,"isCoinbase":false,"fee":10000,"entryType":"receive","calculatedValue":5000000000,"calculatedAddress":"qM7PHGC5BKS2i99uhRDZGJRHdcuvqRUDnD"},{"blockIndex":953111,"unconfirmed":false,"finalized":false,"transactionHash":"991b51ea0b9b3213817c39e2c6d2f5c5738f0d75e1a1dde3bd9d88ce9f4e9e0d","timestamp":1647624784,"isCoinstake":false,"isCoinbase":false,"fee":10000,"entryType":"send","calculatedValue":110000000,"calculatedAddress":"qY22o5Phn7ZfFR6WMuyMYhTf6p93iKSfUx"},{"blockIndex":952671,"unconfirmed":false,"finalized":true,"transactionHash":"d345d40c1c5d9e822c7c33acb31a7cb473c3a880229f37431f5268d199100e37","timestamp":1647603744,"isCoinstake":false,"isCoinbase":false,"fee":10000,"entryType":"send","calculatedValue":50000000,"calculatedAddress":"qMtPTCzfiMXLbXsp2AudTKJ3EjBx9KEEzb"},{"blockIndex":948108,"unconfirmed":false,"finalized":true,"transactionHash":"1bcc4e80b3955b21157ce4be712314d61a5585c82271566accd252b4ddfef712","timestamp":1647392672,"isCoinstake":false,"isCoinbase":false,"fee":10000,"entryType":"consolidated","calculatedAddress":"qPxX5zQnr1AamYsQoc3SMZGLCRofZH19hd;qeVYNbCWhyK1TJavDDCAfSyv3xwntRJFZt"},{"blockIndex":948024,"unconfirmed":false,"finalized":true,"transactionHash":"e3267e470e50b1568094b354d89f88c973247102c7527e051fa756238dd2d83a","timestamp":1647388432,"isCoinstake":false,"isCoinbase":false,"fee":10000,"entryType":"consolidated","calculatedAddress":"qPU8KaJggg2TyEvSNsHkEWo69NQrwWwrkj;qYDNSGCn8qkW7LxbR1sA7uRgeM5rs1MMPn"},{"blockIndex":948022,"unconfirmed":false,"finalized":true,"transactionHash":"dfb7ecbf36a89f8c48b29fb29026db930ee13c348c3b6982e504c7f41a8b3dc1","timestamp":1647388352,"isCoinstake":false,"isCoinbase":false,"fee":10000,"entryType":"consolidated","calculatedAddress":"qQCFoRuY8HD1VGTVDgtkgGvVJSYCq1TkuM;qQQLposLng9V63WNTrgu7QLiNzhZxhWXtS"},{"blockIndex":947980,"unconfirmed":false,"finalized":true,"transactionHash":"c817c500a5ee0cdc83c0fed318bb78f8ce0fcfd31fd989aa98f893e34ed86a09","timestamp":1647386496,"isCoinstake":false,"isCoinbase":false,"fee":10000,"entryType":"consolidated","calculatedAddress":"qSW23izvbcBK5RWq5JFWNKMEGcgjafB7TF;qSDGkrWrRbqQRmnF8QaxSCgks2vrxjrPCR"},{"blockIndex":947956,"unconfirmed":false,"finalized":true,"transactionHash":"0f711a09d511ad3fac8a5ce9bed62c3c6a1d024778d10d440eb70e473b0cb774","timestamp":1647385360,"isCoinstake":false,"isCoinbase":false,"fee":10000,"entryType":"consolidated","calculatedAddress":"qd6oTCuZzNsuNepBi3gXCgbcrfRGSGV12V;qMmoHYXxtVzgcoRrXrstd3XvCnxVvwfi5z"},{"blockIndex":947944,"unconfirmed":false,"finalized":true,"transactionHash":"6346ed342c5fdee7118e91f01fdb218b7ea85104c6f0dda4781c09c106cdee27","timestamp":1647384832,"isCoinstake":false,"isCoinbase":false,"fee":10000,"entryType":"consolidated","calculatedAddress":"qKQ8woCKFZAdZhFo3ozfenJz4mWMhdrqT7;qLmx3yhCiCtQsMCfiptun7cUdngPZrMXb1"},{"blockIndex":889936,"unconfirmed":false,"finalized":true,"transactionHash":"48f70b5fee8c97117bf9f663940d6f8bc2f479d852503d1d9c415835d36298b9","timestamp":1644690544,"isCoinstake":false,"isCoinbase":false,"fee":10000,"entryType":"send","calculatedValue":100000000,"calculatedAddress":"qfaj87QPQqz3HQUujnCg1Nyu66UbMZJpfw"},{"blockIndex":889933,"unconfirmed":false,"finalized":true,"transactionHash":"3620f293d7fd41163d5221134961448c8fe439f9d36a7cc9d68f003bff03e954","timestamp":1644690432,"isCoinstake":false,"isCoinbase":false,"fee":10000,"entryType":"send","calculatedValue":200000000,"calculatedAddress":"qckzgLNbquqm3iRYeYRuUvoHX9Eru1Chcc"},{"blockIndex":889470,"unconfirmed":false,"finalized":true,"transactionHash":"916ab9904b67199521f75ebbafbbfa4a45da6c4af85ed659b3a5ee3f0691eca6","timestamp":1644668896,"isCoinstake":false,"isCoinbase":false,"fee":10000,"entryType":"send","calculatedValue":500000000,"calculatedAddress":"qexoeJZ6De5zgnfZLGZJ6Jvw1vRvDcnGwf"},{"blockIndex":886490,"unconfirmed":false,"finalized":true,"transactionHash":"2816250f1c5dbaad5b2170bc03a592cacd487a54bb42b343efad7693f8b69c4f","timestamp":1644531408,"isCoinstake":false,"isCoinbase":false,"fee":10000,"entryType":"send","calculatedValue":1000000000,"calculatedAddress":"qWJyDGdhauA3YEiTYFnZjaqnw3PB72ideb"},{"blockIndex":886487,"unconfirmed":false,"finalized":true,"transactionHash":"bd8b220a3c603ebae98be4b4cc711a14b9be55e1bc01d6dca140188e9f8ee9b1","timestamp":1644531248,"isCoinstake":false,"isCoinbase":false,"fee":10000,"entryType":"send","calculatedValue":5000000000,"calculatedAddress":"qYyJAxBsHpXXaLt1yuUHzVJFnRa3Vs2Tcn"},{"blockIndex":884394,"unconfirmed":false,"finalized":true,"transactionHash":"3ff9b95aed1d5356494e0dc7fb6303307e781410ab7f3b85f52589fe519a1fb7","timestamp":1644430144,"isCoinstake":false,"isCoinbase":false,"fee":100000,"entryType":"receive","calculatedValue":1000000000000,"calculatedAddress":"qJ68E3QhuT7marpHVSBN3v2dJcwspfUbhz"},{"blockIndex":884341,"unconfirmed":false,"finalized":true,"transactionHash":"db2bdbc219638c732a7e06e04031476ec6df387a913dcc91d8b1d142d9537833","timestamp":1644427712,"isCoinstake":false,"isCoinbase":false,"fee":100000,"entryType":"receive","calculatedValue":1000000000,"calculatedAddress":"qMJeWdpnSSdkaTQUqLzHAtHHJToWdFALp6"},{"blockIndex":0,"unconfirmed":true,"finalized":false,"transactionHash":"3aeebc903b364479e9652a90bd3b8393cee695aec2a776c7ef40069f202cd0dd","timestamp":0,"isCoinstake":false,"isCoinbase":false,"fee":10000,"entryType":"send","calculatedValue":500000000,"calculatedAddress":"qXhSaGzDPphpQChPT86RAgg9v7sTqq1yGP"}]`;

    let history = JSON.parse(array);

    history.sort(sortHistory);
    console.log(JSON.stringify(history));
    expect(history[0].unconfirmed).toBeTrue();

    history.sort(sortHistory);
    console.log(JSON.stringify(history));
    expect(history[0].unconfirmed).toBeTrue();
  });

  it('Validate WalletStore', async () => {
    const walletsArray = JSON.parse(testWallet) as Wallet[];

    // Process Wallets
    const walletStore = new WalletStore();
    walletStore.set(walletsArray[0].id, walletsArray[0]);

    const wallets1 = walletStore.getWallets();

    await walletStore.save();
    await walletStore.load();

    const wallets2 = walletStore.getWallets();

    wallets1[0].name = 'Wallet1';
    wallets2[0].name = 'Wallet2';

    // Since we have persisted and loaded the initial objects, they are no longer by-reference but different objects:
    expect(wallets1[0].name).toBe('Wallet1');
    expect(wallets2[0].name).toBe('Wallet2');

    // Get again from the wallet store, this should just be by-reference:
    const wallets3 = walletStore.getWallets();
    expect(wallets3[0].name).toBe('Wallet2');
  });

  // it('Validate Indexer', async () => {
  //     const walletsArray = JSON.parse(testWallet) as Wallet[];

  //     // Process Wallets
  //     const walletStore = new WalletStore();
  //     walletStore.set(walletsArray[0].id, walletsArray[0]);

  //     const wallets = walletStore.getWallets();

  //     const transactionStore = new TransactionStore();
  //     const addressStore = new AddressStore();

  //     // const manager = new LightWalletManager(walletStore, addressStore, transactionStore);

  //     const settingStore = new SettingStore();
  //     const networkLoader = new NetworkLoader();
  //     const addressManager = new AddressManager(networkLoader);

  //     const accountHistoryStore = new AccountHistoryStore();

  //     const indexer = new IndexerBackgroundService(settingStore, walletStore, addressStore, transactionStore, addressManager, accountHistoryStore);
  //     await indexer.process(null);
  // });

  it('Validate reset timer logic', () => {
    // This is what is read from storage, last "active date" stored.
    const currentDateJson = new Date(2022, 1, 20, 11, 30).toJSON();
    let currentResetDate = new Date(currentDateJson);

    // This is the current date.
    const currentDate = new Date(2022, 1, 20, 11, 31);
    // This value is read from user settings.
    const timeout = 4; // minutes
    const timeoutMs = timeout * 60 * 1000;

    // The reset date is current date minus the timeout.
    var resetDate = new Date(currentDate.valueOf() - timeoutMs);

    // console.log('currentDate:', currentDate.toISOString());
    console.log('resetDate:', resetDate.toISOString());
    console.log('currentResetDate:', currentResetDate.toISOString());

    // The reset date (calculated) should always be older than current reset date (based upon user action)

    expect(resetDate < currentResetDate).toBeTrue();

    // User has not been active for more than 6 minutes...
    currentResetDate = new Date(2022, 1, 20, 11, 26);
    expect(resetDate > currentResetDate).toBeTrue();
    expect(resetDate < currentResetDate).toBeFalse();
  });

  it('Validate secure storage logic', () => {
    // The in-memory state and how we want it to be represented after loading.
    const state = new Map<string, string>();

    const privateKey = secp.utils.randomPrivateKey();
    state.set('12356-123', Buffer.from(privateKey).toString('base64'));

    console.log('state', state);

    // var b64: any = Buffer.from(privateKey).toString('base64');
    // var u8: any = new Uint8Array(Buffer.from(b64, 'base64'));

    // console.log('b64', b64);
    // console.log('u8', u8);

    // Simulate storing.
    const serializedState = JSON.stringify(Array.from(state.entries()));
    console.log('serializedState:', serializedState);
    const loadedState = JSON.parse(serializedState);

    // Now the seed has been turned into ArrayBuffer (which is the underlaying structure on which Uint8Array is an view into).
    console.log('loadedstate', loadedState);

    const restoredState = new Map(loadedState);

    console.log('restoredMap', restoredState);

    // restoredState.forEach((value: any, key, map) => {
    //   value.seed = new Uint8Array(Buffer.from(value.seed, 'base64'));
    // });

    console.log('restoredState', restoredState);
  });

  // it('Load xpub and query the indexer APIs', async () => {
  //     const networkLoader = new NetworkLoader();
  //     const network = new STRAX();
  //     const indexer = new IndexerBackgroundService(new SettingStore(), new WalletStore(), new AddressStore(), new TransactionStore(), new AddressManager(networkLoader), new AccountHistoryStore());

  //     const addressState: AddressState = {
  //         address: 'XEgeAGBEdKXcdKD2HYovtyp5brE5WyAKwv', // Random address from rich list
  //         offset: 0,
  //         transactions: []
  //     };

  //     // 'XWaKvgJ1HpCA8nKnqQcGESmDdMXFjmUVbH' // Random address with 7 transactions.
  //     // 'XEgeAGBEdKXcdKD2HYovtyp5brE5WyAKwv' // Random address with a good amount of transactions.

  //     const indexerUrl = 'https://{id}.indexer.blockcore.net'.replace('{id}', network.id.toLowerCase());
  //     const transactions = new Map<string, Transaction>();

  //     await indexer.processAddress(indexerUrl, addressState);

  //     expect(addressState.transactions.length).toBeGreaterThanOrEqual(69);
  //     expect(addressState.offset).toBeGreaterThanOrEqual(60);

  //     // Second run should only query from finalized offset and only get info, not get hex again.
  //     await indexer.processAddress(indexerUrl, addressState);

  //     console.log('Transactions:', transactions);
  //     console.log('addressState:', addressState);
  // });

  function pad(n: bigint, length = 64, base = 16) {
    // return n.toString(base).padStart(length, '0');
    return n.toString();
  }

  it('Combine BIP32 with BIP340', async () => {
    // BIP0340: https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki#public-key-conversion

    /**
     * Public Key Conversion
     *
     * As an alternative to generating keys randomly, it is also possible and safe to repurpose existing key generation algorithms for ECDSA in a compatible way.
     * The secret keys constructed by such an algorithm can be used as sk directly.
     * The public keys constructed by such an algorithm (assuming they use the 33-byte compressed encoding) need to be converted by dropping the first byte.
     * Specifically, BIP32 and schemes built on top of it remain usable.
     */

    const text = 'hello world';
    // const messageArray = new TextEncoder().encode(text);
    const messageArray = new Uint8Array(Buffer.from(text));

    const prv1 =
      '6ff043f290f94df6566b2ccb94e8b6d10b9557045e0f895312988b3bfe0a2167';
    const pub1 =
      '039ea2b936be11e39f4e40b8c42ed876b34fc6eb1df18dd488a65eb8c4bbc897cc';

    const prv2 =
      'd8acabee355659fd308c13d289125c46bd96c3fcedeb03969fc0cfb138b120a6';
    const pub2 =
      '023fd1cd2a5f8358c5633a5349618cb74f3b0e981ee9a512f9d1e1c71a4f83af82';

    // const privateKey = secp.utils.randomPrivateKey();
    const messageHash = await secp.utils.sha256(messageArray);

    const publicKey1 = secp.getPublicKey(prv1, true);
    const publicKey2 = secp.getPublicKey(prv2, true);
    const publicKeySchnorr1 = secp.schnorr.getPublicKey(prv1);
    const publicKeySchnorr2 = secp.schnorr.getPublicKey(prv2);

    // No matter if the ECDSA Y value is odd or even, it will be same as schnorr pubkey.
    // Specification: https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki#public-key-conversion
    expect(publicKey1.slice(1)).toEqual(publicKeySchnorr1);
    expect(publicKey2.slice(1)).toEqual(publicKeySchnorr2);

    // Create signatures of ECDSA and Schnorr:
    const signature1 = await secp.sign(messageHash, prv1);
    const signature2 = await secp.sign(messageHash, prv2);
    const signatureSchnorr1 = await secp.schnorr.sign(messageHash, prv1);
    const signatureSchnorr2 = await secp.schnorr.sign(messageHash, prv2);

    // Verify using ECDSA compressed public key:
    expect(secp.verify(signature1, messageHash, publicKey1)).toBeTrue();
    expect(secp.verify(signature2, messageHash, publicKey2)).toBeTrue();

    // Attempting to verify using schnorr key:
    expect(
      await secp.schnorr.verify(
        signatureSchnorr1,
        messageHash,
        publicKeySchnorr1
      )
    ).toBeTrue();

    expect(
      await secp.schnorr.verify(
        signatureSchnorr2,
        messageHash,
        publicKeySchnorr2
      )
    ).toBeTrue();

    // Here follows an example where one must be careful not to use schnorr public keys
    // against the ECSDA verification methods. This will work in ~50% of cases.

    // Attempt to verify ECSDA signature using Schnorr public key, this should fail (odd key):
    expect(secp.verify(signature1, messageHash, publicKeySchnorr1)).toBeFalse();

    // This actually works, because they key is even (probably default):
    expect(secp.verify(signature2, messageHash, publicKeySchnorr2)).toBeTrue();

    // Verify using Schnorr method with ECSDA pubkey, this will work in ~50% of cases (odd/even).
    expect(
      await secp.schnorr.verify(signatureSchnorr1, messageHash, publicKey1)
    ).toBeFalse();

    expect(
      await secp.schnorr.verify(signatureSchnorr2, messageHash, publicKey2)
    ).toBeTrue();

    // Next step is combining with BIP32:
    const recoveryPhrase =
      'rescue interest concert clinic build half glow exchange oak holiday garlic scrub';

    const network = {
      public: 0x0488b21e,
      private: 0x0488ade4,
    };

    const seed = mnemonicToSeedSync(recoveryPhrase);
    const masterNode = HDKey.fromMasterSeed(seed, network);

    const accountNode = masterNode.derive(`m/302'/616'/0'`);
    const xpub = accountNode.publicExtendedKey;
    const addressNode1 = accountNode.deriveChild(0).deriveChild(0); // even pub key
    const addressNode2 = accountNode.deriveChild(0).deriveChild(2); // odd pub key

    const pubEcdsa = secp.getPublicKey(addressNode1.privateKey!, true);
    const pubSchnorr = secp.schnorr.getPublicKey(addressNode1.privateKey!);

    expect(pubEcdsa.length).toBe(33);
    expect(pubSchnorr.length).toBe(32);

    // Restore from xpub:
    const accountNodePub = HDKey.fromExtendedKey(xpub, network);
    const addressNodePub = accountNodePub.deriveChild(0).deriveChild(0);
    const addressNodePubSliced = addressNodePub.publicKey!.slice(1);

    const addressNodePub2 = accountNodePub.deriveChild(0).deriveChild(2);
    const addressNodePubSliced2 = addressNodePub2.publicKey!.slice(1);

    // Verify that the public key derived from private key, is exactly the same as the compressed ECSDA without prefix:
    expect(pubSchnorr).toEqual(addressNodePubSliced);

    // Take the BIP32 derived private key, sign and then verify using the sliced key:
    const signatureFromNode1 = await secp.schnorr.sign(
      messageHash,
      addressNode1.privateKey!
    );

    expect(
      await secp.schnorr.verify(
        signatureFromNode1,
        messageHash,
        addressNodePubSliced
      )
    ).toBeTrue;

    const signatureFromNode2 = await secp.schnorr.sign(
      messageHash,
      addressNode2.privateKey!
    );

    expect(
      await secp.schnorr.verify(
        signatureFromNode2,
        messageHash,
        addressNodePubSliced2
      )
    ).toBeTrue();
  });

  it('Validate xpub load and address derivation', async () => {
    // REMEMBER: This is a test wallet that you must never re-use yourself. This is for unit testing only.
    // Recovery Phrase: rescue interest concert clinic build half glow exchange oak holiday garlic scrub
    // STRAX
    const xpub =
      'xpub6DEJAVH2NnLS8a7TnvPLrtbigyZcV19qf4k17CADDmKnuCnyG1AvQD1uEWUzYzPTrDpiXtodYHTrhWH4ndU1nDGvYrwGp8oSNCyCsdxyjeT';
    const password = 'V1O4BIIvrmqU!23@@322687.';

    // const indexer = new IndexerBackgroundService();

    const wallet = JSON.parse(testWallet)[0];
    expect(wallet.restored).toBeTrue();

    const account = wallet.accounts[0];
    const network = new STRAX();
    expect(account.networkType).toBe(network.id);

    const cryptoService = new CryptoService();
    const crypto = new CryptoUtility();

    let unlockedMnemonic = await cryptoService.decryptData(wallet.mnemonic, password);

    expect(unlockedMnemonic).toBeTruthy();

    // From the secret receovery phrase, the master seed is derived.
    // Learn more about the HD keys: https://raw.githubusercontent.com/bitcoin/bips/master/bip-0032/derivation.png
    // const masterSeed = mnemonicToSeedSync(unlockedMnemonic);

    const accountNode = HDKey.fromExtendedKey(account.xpub, network.bip32);

    const addressNodeReceive = accountNode.deriveChild(0).deriveChild(0);
    const addressNodeChange = accountNode.deriveChild(1).deriveChild(0);

    const addressReceive = crypto.getAddressByNetwork(
      Buffer.from(addressNodeReceive.publicKey),
      network,
      account.purposeAddress
    );
    const addressChange = crypto.getAddressByNetwork(
      Buffer.from(addressNodeChange.publicKey),
      network,
      account.purposeAddress
    );

    expect(addressReceive).toBe('XM6QX8CFxE4ZjK5BjUXisaceTWrwHhWoq8');
    expect(addressChange).toBe('XSB5bTvf6zDjpWKRWsXt5r1mHuCWtnV65c');
  });

  const testWallet = `[
    {
        "restored": true,
        "id": "388fd31e-c57d-42f5-9e0b-43a1c97103de",
        "name": "My Wallet",
        "mnemonic": "lB+p+M8UcWePv5TJJYCi5F6RXg/g5dVcbTYpSGoO7Knj4zII1MtG1S84H7sWA4e4YAM6AjAcXbY55w+mstt5u+9VuSilw65GkpZkGXz0Y+vIhSjDAMjPqjbdNW5XLtivVwvWf0dgYdyYyGv/FzAMICFHxvllXHpzLlFscw==",
        "activeAccountId": "04de8ec6-6cf3-4aeb-ae3c-d13ff3d0c8d6",
        "accounts": [
            {
                "identifier": "c0ea1e83-118f-477c-aee0-922bba0ac5fb",
                "networkType": "STRAX",
                "index": 0,
                "name": "Stratis",
                "type": "coin",
                "network": 105105,
                "purpose": 44,
                "purposeAddress": 44,
                "icon": "paid",
                "state": {
                    "balance": 0,
                    "retrieved": null,
                    "receive": [
                        {
                            "index": 0,
                            "address": "XM6QX8CFxE4ZjK5BjUXisaceTWrwHhWoq8",
                            "transactions": [],
                            "retrieved": "2022-02-28T20:20:57.480Z",
                            "unspent": []
                        }
                    ],
                    "change": [
                        {
                            "index": 0,
                            "address": "XSB5bTvf6zDjpWKRWsXt5r1mHuCWtnV65c"
                        }
                    ]
                },
                "xpub": "xpub6DEJAVH2NnLS8a7TnvPLrtbigyZcV19qf4k17CADDmKnuCnyG1AvQD1uEWUzYzPTrDpiXtodYHTrhWH4ndU1nDGvYrwGp8oSNCyCsdxyjeT",
                "selected": false
            },
            {
                "identifier": "22963e7e-34b0-4c70-ab73-2abf0795494a",
                "networkType": "CRS",
                "index": 0,
                "name": "Cirrus",
                "type": "coin",
                "network": 401,
                "purpose": 44,
                "purposeAddress": 44,
                "icon": "paid",
                "state": {
                    "balance": 0,
                    "retrieved": null,
                    "receive": [
                        {
                            "index": 0,
                            "address": "CLhUvcRkRdatEiPUQo6hDxnD2boa5uEB4D",
                            "transactions": [],
                            "retrieved": "2022-02-28T20:20:57.495Z",
                            "unspent": []
                        }
                    ],
                    "change": [
                        {
                            "index": 0,
                            "address": "CSe9s9SaZmWmhqJeFD5bzFW9LxMeNp9daM"
                        }
                    ]
                },
                "xpub": "xpub6CYV24sHdhtk9vDGuDAeDrNUxZGiJx934XmfedhGnpdFbyxD7QZRqXLJdXxKxVxu5tBgoPVbCkc7Rh6eou79sZbU8XVkQLeh4iTEDLYotYg",
                "selected": false
            },
            {
                "identifier": "82b1b9a9-2207-4cdb-80f3-694c1320ce80",
                "index": 0,
                "networkType": "TSTRAX",
                "name": "StratisTest",
                "type": "coin",
                "network": 1,
                "purpose": 44,
                "purposeAddress": 44,
                "icon": "account_circle",
                "state": {
                    "balance": 0,
                    "retrieved": null,
                    "receive": [
                        {
                            "index": 0,
                            "address": "qUsiVmEX7JoiuQm5WANoQ4QVrizMHZpiq9",
                            "transactions": [],
                            "retrieved": "2022-02-28T20:20:57.510Z",
                            "unspent": []
                        }
                    ],
                    "change": [
                        {
                            "index": 0,
                            "address": "qdbtSdsrwtiM9mxcYfukA1Kqu5YgoFX1vf"
                        }
                    ]
                },
                "xpub": "xpub6CwtgLXT2q9RPNbeKfGHteY7jFWv1mnUjZsd8V25ieZoZP4iNhvswGHbxRsVbCiLzrULvRi6Nmuh1p2RqmKDpeyUBggwtgzeVkmK9rdeV8u",
                "selected": false
            },
            {
                "identifier": "04de8ec6-6cf3-4aeb-ae3c-d13ff3d0c8d6",
                "index": 0,
                "networkType": "TCRS",
                "name": "CirrusTest",
                "type": "coin",
                "network": 400,
                "purpose": 44,
                "purposeAddress": 44,
                "icon": "account_circle",
                "state": {
                    "balance": 0,
                    "retrieved": null,
                    "receive": [
                        {
                            "index": 0,
                            "address": "tShP3s9ZTZQ8EuhySGXUfa8KeiYMh7jGuu"
                        }
                    ],
                    "change": [
                        {
                            "index": 0,
                            "address": "t8YUkgyCSTznAHhSsmMT9VeaeNwrwgo6Ys"
                        }
                    ]
                },
                "xpub": "xpub6CNbYrj4hwqZvRNSdarG2WajgpLsSELPFZs15mnAwRsqDukZjCg9XzxjR6Wy2kvXAQL5TR8wNS1x91h5GeiJEjjZuRYsc9MjNhiwic6ae1q",
                "selected": false
            }
        ]
    }
]`;
});
