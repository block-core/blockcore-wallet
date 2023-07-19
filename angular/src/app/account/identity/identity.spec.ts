// import { anchor, DID, generateKeyPair } from '@decentralized-identity/ion-tools';

// describe('did:ion', () => {

//     beforeEach(async () => {

//     });

//     it('Create identity', async () => {
//         // Generate keys and ION DID
//         let authnKeys = await generateKeyPair();
//         let did = new DID({
//             content: {
//                 publicKeys: [
//                     {
//                         id: 'key-1',
//                         type: 'EcdsaSecp256k1VerificationKey2019',
//                         publicKeyJwk: authnKeys.publicJwk,
//                         purposes: ['authentication']
//                     }
//                 ],
//                 services: [
//                     {
//                         id: 'domain-1',
//                         type: 'LinkedDomains',
//                         serviceEndpoint: 'https://foo.example.com'
//                     }
//                 ]
//             }
//         });

//         let options = {
//             // nodeEndpoint: 'https://localhost',
//             // challengeEndpoint: 'https://localhost/2',
//             // solutionEndpoint: 'https://localhost/3',
//             nodeEndpoint: 'https://beta.discover.did.microsoft.com/1.0/identifiers',
//             challengeEndpoint: 'https://beta.ion.msidentity.com/api/v1.0/proof-of-work-challenge',
//             solutionEndpoint: 'https://beta.ion.msidentity.com/api/v1.0/operations'
//         };

//         // Generate and publish create request to an ION node
//         let createRequest = await did.generateRequest(0);
//         console.log('CREATE REQUEST:', createRequest);

//         let anchorResponse = await anchor(createRequest, options);

//         // Store the key material and source data of all operations that have been created for the DID
//         let ionOps = await did.getAllOperations();
//         console.log({ ops: ionOps });
//         // await writeFile('./ion-did-ops-v1.json', JSON.stringify({ ops: ionOps }));

//     });

//     it('Should persist account state', async () => {

//     });

// });


