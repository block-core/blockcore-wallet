export interface NonFungibleToken {
  id: string;
  Creator: string;
  uri: string
  isBurned: boolean;
  pricePaid: number;
  transactionId: string;
  tokenSaleEvent: any;
  contractId: string
}

export interface attribute {
  trait_type: string;
  value: number;
  display_type: string;
}

export class TokenJson {
  name: string;
  image: string;
  description: string;
  external_url: string;
  attributes: attribute[]
}
