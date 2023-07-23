import { DIDResolutionOptions, DIDResolutionResult, Resolver } from 'did-resolver';
import is from '@blockcore/did-resolver';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
/** Helps resolve all DID Methods that the Blockcore Wallet supports. */
export class IdentityResolverService {
  private resolver: Resolver;

  constructor() {
    // TODO: The Blockcore Wallet will be able to resolve multiple, so use the below code:
    //If you are using multiple methods you need to flatten them into one object
    // const resolver = new Resolver({
    // 	...ethrResolver,
    // 	...webResolver,
    // });

    const isResolver = is.getResolver();

    const ionResolver = {
      ion: async (didUri: string, options: DIDResolutionOptions = {}) => {
        debugger;
        // https://beta.discover.did.microsoft.com/1.0/identifiers
        // https://ion.tbd.engineering/operations
        const nodeEndpoint = 'https://ion.tbd.engineering/identifiers';

        const response = await fetch(`${nodeEndpoint}/${didUri}`);

        if (response.status >= 400) {
          throw new Error(response.statusText);
        }

        const didResolution: DIDResolutionResult = await response.json();
        return didResolution;
      }
    };

    this.resolver = new Resolver({
      ...isResolver,
      ...ionResolver,
    });
  }

  async resolve(didUri: string, options: DIDResolutionOptions = {}) {
    return this.resolver.resolve(didUri, options);
  }
}
