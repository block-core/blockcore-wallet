import {StoreListBase} from "./store-base";
import {Token} from "../interfaces";

export class StandardTokenStore extends StoreListBase<Token> {
  constructor() {
    super('standardToken');
  }
}
