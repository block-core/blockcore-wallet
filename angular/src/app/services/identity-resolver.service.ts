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
    const isResolver = is.getResolver();

    const ionResolver = {
      ion: async (didUri: string, options: DIDResolutionOptions = {}) => {
        // https://beta.discover.did.microsoft.com/1.0/identifiers
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
