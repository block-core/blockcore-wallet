import { SendService } from "./send.service";

describe('SendService', () => {
    let service: SendService;
    beforeEach(() => { service = new SendService(); });

    it('Validate calculations', async () => {

        service.fee = "0.0010000";
        service.amount = "1.1";

        console.log(service.amountAsSatoshi);

    });
});