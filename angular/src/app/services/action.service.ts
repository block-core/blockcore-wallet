import { Injectable } from "@angular/core";
import { Action, ActionStore } from "src/shared";

@Injectable({
    providedIn: 'root'
})
export class ActionService {
    constructor(private store: ActionStore) {

    }

    app: string;
    content: string;

    async clearAction() {
        this.store.set(undefined);
        await this.store.save();
    }

    async setAction(data: Action, broadcast: boolean) {
        if (typeof data.action !== 'string') {
            console.error('Only objects that are string are allowed as actions.');
            return;
        }

        if (data.document != null && typeof data.document !== 'string') {
            console.error('Only objects that are string are allowed as actions.');
            return;
        }

        this.store.set(data);

        await this.store.save();

        // if (broadcast) {
        //     this.broadcastState();
        // }

        // Raise this after state has been updated, so orchestrator in UI can redirect correctly.
        // this.communication.sendToAll('action-changed', this.state.action);
    }
}
