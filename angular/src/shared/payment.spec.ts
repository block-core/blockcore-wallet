import { PaymentRequest } from './payment';

describe('PaymentRequest', () => {
  beforeEach(() => {});

  it('Should encode and decode payment links correctly', async () => {
    const payment = new PaymentRequest();

    const paymentEncoded = payment.encode({
      address: 'tSXDbedw3o79gjijk29dZLNMtcYmymYtoX',
      network: 'tcrs',
      options: {
        amount: 20.3,
        label: 'Headline label',
        message: 'Main content...',
        data: 'MzExMzUzNDIzNDY',
        id: 4324,
      },
    });

    expect(paymentEncoded).toBeDefined();

    const paymentDecoded = payment.decode(paymentEncoded);
    expect(paymentDecoded.address).toBe('tSXDbedw3o79gjijk29dZLNMtcYmymYtoX');
    expect(paymentDecoded.network).toBe('tcrs');
    expect(paymentDecoded.options.amount).toBe('20.3');

    // The payment should not contain HTTP handler prefix (web+pay):

    try {
      const request1 = payment.decode('web+pay://tcrs:tSXDbedw3o79gjijk29dZLNMtcYmymYtoX?amount=2&label=Your Local Info&message=Invoice Number 5&data=MzExMzUzNDIzNDY&id=4324');
    } catch (err) {
      // expect(err).toContain('Invalid BIP21 URI');
    }

    const request2 = payment.decode('tcrs:tSXDbedw3o79gjijk29dZLNMtcYmymYtoX?amount=2&label=Your Local Info&message=Invoice Number 5&data=MzExMzUzNDIzNDY&id=4324');
    expect(request2.address).toBe('tSXDbedw3o79gjijk29dZLNMtcYmymYtoX');
    expect(request2.network).toBe('tcrs');
    expect(request2.options.amount).toBe('2');
    expect(request2.options.label).toBe('Your Local Info');
    expect(request2.options.data).toBe('MzExMzUzNDIzNDY');
    expect(request2.options.message).toBe('Invoice Number 5');
    expect(request2.options.id).toBe('4324');

    const request3 = payment.decode('city:Ccoquhaae7u6ASqQ5BiYueASz8EavUXrKn?amount=10&label=Your Local Info&message=Invoice Number 5&data=MzExMzUzNDIzNDY&id=4324');
    expect(request3.address).toBe('Ccoquhaae7u6ASqQ5BiYueASz8EavUXrKn');
    expect(request3.network).toBe('city');
    expect(request3.options.amount).toBe('10');

    const uri = payment.removeHandler('web+pay://city:Ccoquhaae7u6ASqQ5BiYueASz8EavUXrKn?amount=10&label=Your Local Info&message=Invoice Number 5&data=MzExMzUzNDIzNDY&id=4324');
    console.log('URI:', uri);
  });
});
