// import { storage } from 'webextension-polyfill';
// import { Storage, TableAccountState, TableWallet } from './storage';
// import { str } from '@scure/base';
// import exp from 'constants';

// describe('Storage', () => {
//     let storage: Storage;

//     beforeEach( async () => {
//         storage = new Storage('blockcore-wallet-test');
//         await storage.open(); 
//      });

//     it('Should be able to create the database', async () => {
//         expect(storage).toBeDefined();
//     });

//     it('Should persist account state', async () => {
        
//         var doc: TableAccountState = {
//             id: '12345',
//             balance: 110
//         };

//         await storage.putAccountState(doc);

//         var result = await storage.getAccountState('12345');
//         expect(doc.balance).toBe(result.balance);
//         // await storage.delete();
//     });

//     it('Should persist and delete wallet state', async () => {
//        var doc: TableWallet = {
//         id: '123',
//         name: 'testWallet',
//         restored: false,
//         mnemonic: '',
//         accounts: [],
//         extensionWords: '',
//         biometrics: false
//        };

//        await storage.putWallet(doc);

//        let result = await storage.getWallet('1234');
//        expect(result).toBeUndefined();
//        result = await storage.getWallet('123');
//        expect(result).toBeDefined();
//        expect(result.name).toBe('testWallet');

//        await storage.deleteWallet(doc.id);

//        result = await storage.getWallet(doc.id);
//        expect(result).toBeUndefined();
//     })
// });
