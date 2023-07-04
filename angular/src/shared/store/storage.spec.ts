import { Storage, TableAccountState } from './storage';

describe('Storage', () => {
    beforeEach(() => { });

    it('Should be able to create the database', async () => {
        var storage = new Storage('blockcore-wallet-test');
        await storage.open();


        var doc: TableAccountState = {
            id: '12345',
            balance: 100
        };

        await storage.putAccountState(doc);

        var result = await storage.getAccountState('12345');
        expect(doc.balance).toBe(result.balance);

        // await storage.delete();
    });
});
