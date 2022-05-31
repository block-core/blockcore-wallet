export class SharedManager {
    isExtension;

    constructor() {
        this.isExtension = (globalThis.chrome && globalThis.chrome.runtime && globalThis.chrome.tabs);
    }

    async checkLockTimeout() {
        // console.log('SharedManager:checkLockTimeout');

        if (this.isExtension) {
            const storage = globalThis.chrome.storage as any;

            // Get both "active" (Date) and timeout (number of minutes) from local settings.
            const { active, timeout } = await chrome.storage.local.get(['active', 'timeout']);

            // Reset storage if there is no 'active' state data.
            if (!active) {
                await storage.session.remove(['keys']);
                // await storage.session.clear(); // Might be dramatic to clear to whole session storage?
                console.log('There are no active value, session storage is cleared.');
            } else {
                // Parse the active date.
                const timeoutDate = new Date(active);

                // The reset date is current date minus the timeout.
                var resetDate = new Date(new Date().valueOf() - timeout);

                // Check of the timeout has been reached and clear if it has.
                if (resetDate > timeoutDate) {
                    await storage.session.remove(['keys']);
                    // await storage.session.clear(); // Might be dramatic to clear to whole session storage?
                    console.log('Timeout has been researched, session storage is cleared.');

                    // TODO: #132
                    chrome.runtime.sendMessage({ type: 'timeout' }, function (response) {
                        // console.log('Extension:sendMessage:response:', response);
                    });

                    return true;
                }
            }

            return false;

        } else {
            const { active } = JSON.parse(globalThis.localStorage.getItem('active'));
            const { timeout } = JSON.parse(globalThis.localStorage.getItem('timeout'));

            // Get both "active" (Date) and timeout (number of minutes) from local settings.
            // const { active, timeout } = await storage.getItem().get(['active', 'timeout']);

            // Reset storage if there is no 'active' state data.
            if (!active) {
                // In the browser, the keys are ONLY in session, we should not persist permanently!
                globalThis.sessionStorage.removeItem('keys');
                // await storage.session.clear(); // Might be dramatic to clear to whole session storage?
                console.log('There are no active value, session storage is cleared.');
            } else {
                // Parse the active date.
                const timeoutDate = new Date(active);

                // The reset date is current date minus the timeout.
                var resetDate = new Date(new Date().valueOf() - timeout);

                // Check of the timeout has been reached and clear if it has.
                if (resetDate > timeoutDate) {
                    globalThis.sessionStorage.removeItem('keys');
                    // await storage.session.clear(); // Might be dramatic to clear to whole session storage?
                    console.log('Timeout has been reached, session storage is cleared.');

                    return true;

                    // TODO: Send Timeout message in browser.

                    // chrome.runtime.sendMessage({ event: 'timeout' }, function (response) {
                    //     console.log('Extension:sendMessage:response:', response);
                    // });
                }
            }

            return false;
        }
    }
}
