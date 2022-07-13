import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import axios from "axios";
import { NonFungibleToken, TokenJson } from "./collectables.interfaces";

@Component({
  selector: 'app-non-fungible-token',
  templateUrl: './non-fungible-token.component.html',
  styleUrls: ['./non-fungible-token.component.css']
})

export class NonFungibleTokenComponent implements OnInit, OnDestroy {
  @Input() nonFungibleToken: NonFungibleToken;
  tokenJson: TokenJson;
  showImage: boolean;
  activatedRoute: ActivatedRoute;
  showAttributes: boolean;

  constructor(activatedRoute: ActivatedRoute) {
    this.activatedRoute = activatedRoute;
    this.tokenJson = new TokenJson();
    this.showImage = false;
  }

  ngOnDestroy(): void {
  }

  async ngOnInit(): Promise<void> {
    const response = await axios.get(this.nonFungibleToken.uri, {
      withCredentials: false,
      'axios-retry': { retries: 0 }
    });

    if (response.data != undefined)
      this.tokenJson = response.data;
  }

  toggleAttributes() {
    this.showAttributes = !this.showAttributes;
  }
}
