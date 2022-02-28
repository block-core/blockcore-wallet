import * as secp from "@noble/secp256k1";
import { IndexerBackgroundService } from "src/shared/indexer";

describe('GenericTests', () => {
  beforeEach(() => { });

  it('Validate reset timer logic', () => {
    // This is what is read from storage, last "active date" stored.
    const currentDateJson = new Date(2022, 1, 20, 11, 30).toJSON();
    let currentResetDate = new Date(currentDateJson);

    // This is the current date.
    const currentDate = new Date(2022, 1, 20, 11, 31);
    // This value is read from user settings.
    const timeout = 4; // minutes
    const timeoutMs = (timeout * 60 * 1000);

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




  it('Validate wallet indexing', () => {

    // rescue interest concert clinic build half glow exchange oak holiday garlic scrub
    // STRAX
    const xpub = "xpub6DEJAVH2NnLS8a7TnvPLrtbigyZcV19qf4k17CADDmKnuCnyG1AvQD1uEWUzYzPTrDpiXtodYHTrhWH4ndU1nDGvYrwGp8oSNCyCsdxyjeT";

    const indexer = new IndexerBackgroundService();


  });
});