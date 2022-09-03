export class PaymentRequestData {
  address: string;
}

export class PaymentRequest {
  decode(uri: string) : PaymentRequestData {
    return { address: '123' };
  }

  encode(request: object) {}
}
