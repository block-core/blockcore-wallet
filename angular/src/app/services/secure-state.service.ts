import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class SecureStateService {
    private timer: any;

    constructor(
        // This should be done outside of the service.
        
    ) {
        this.resetTimer();
    }

    resetTimer() {
        this.logger.info('resetTimer:', this.state.persisted.settings.autoTimeout * MINUTE);

        if (this.timer) {
            clearTimeout(this.timer);
        }

        // We will only set timer if the wallet is actually unlocked.
        if (this.walletSecrets.size > 0) {
            this.logger.info('Setting timer to automatically unlock.');
            this.timer = setTimeout(
                () => {
                    this.lockWallets();
                },
                this.state.persisted.settings.autoTimeout * MINUTE
            );
        } else {
            this.logger.info('Timer not set since wallet is not unlocked.');
        }
    }
}