import { PaymentRequest } from './payment';

describe('PaymentRequest', () => {
  beforeEach(() => {});

  it('Should encode and decode payment links correctly', async () => {
    const payment = new PaymentRequest();

    payment.encode({
      address: 'tSXDbedw3o79gjijk29dZLNMtcYmymYtoX',
      network: 'tcrs',
      amount: 20.3,
      label: 'Headline label',
      message: 'Main content...',
      data: 'MzExMzUzNDIzNDY=',
      id: 4324,
    });

    const request = payment.decode('web+pay://tcrs:tSXDbedw3o79gjijk29dZLNMtcYmymYtoX?amount=2&label=Your Local Info&message=Invoice Number 5&data=MzExMzUzNDIzNDY=&id=4324');

    expect(request.address).toBe('tSXDbedw3o79gjijk29dZLNMtcYmymYtoX');
  });
});
