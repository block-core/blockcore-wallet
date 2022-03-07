import { Injectable } from "@angular/core";
import { Action, NetworkStatus } from "../interfaces";
import { StoreBase, StoreListBase } from "./store-base";

export class NetworkStatusStore extends StoreListBase<NetworkStatus> {
    constructor() {
        super('networkstatus');
    }
}
