export interface NonFungibleToken {
  Id: string;
  Creator: string;
  uri: string
  IsBurned: boolean;
  PricePaid: number;
  TransactionId: string;
  TokenSaleEvent: any;
  ContractId: string
}

export interface attribute{
  trait_type:string;
  value:number;
  display_type:string;
}

export class TokenJson{
  name:string;
  image:string;
  description:string;
  external_url:string;
  attributes:attribute[]
}
