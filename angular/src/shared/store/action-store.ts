import { Injectable } from "@angular/core";
import { Action } from "../interfaces";
import { StoreBase } from "./store-base";

export class ActionStore extends StoreBase<Action> {
    constructor() {
        super('action');
    }
}
