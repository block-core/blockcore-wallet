import * as qs from 'qs';
import Big from 'big.js';

export class PaymentRequestData {
  address: string;
  network: string;
  options: any;
}

export class PaymentRequest {
  decode(uri: string): PaymentRequestData {
    if (uri.indexOf('web+pay://') > -1) {
      throw new Error('Invalid BIP21 URI, should not contain :// prefix: ' + uri);
    }

    var urnScheme = uri.slice(0, uri.indexOf(':')).toLowerCase();
    var split = uri.indexOf('?');
    var address = uri.slice(urnScheme.length + 1, split === -1 ? undefined : split);
    var query = split === -1 ? '' : uri.slice(split + 1);
    var options = qs.parse(query);

    if (options['amount']) {
      const amount = Big(<string>options['amount']);
      if (amount.lt(0)) {
        throw new Error('Invalid amount');
      }

      // Parse the amount and verify it's a valid Big value.
      options['amount'] = amount.toJSON();
    }

    return { address: address, network: urnScheme, options: options };
  }

  encode(request: any): string {
    var address = request.address;
    delete request.address;

    var network = request.network;
    delete request.network;

    var query = qs.stringify(request);

    return network + ':' + address + (query ? '?' : '') + query;
  }
}
