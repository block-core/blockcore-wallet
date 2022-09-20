import {StoreListBase} from "./store-base";
import {AccountTokens, Token} from "../interfaces";

export class StandardTokenStore extends StoreListBase<AccountTokens> {
  constructor() {
    super('standardtoken');
  }
}
