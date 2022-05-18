import {Component, Inject, inject, Input, OnDestroy, OnInit} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {NonFungibleToken} from "./Collectables.interfaces";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-non-fungible-token',
  templateUrl: './non-fungible-token.component.html',
 // styleUrls: ['./non-fungible-token.component.css']
})

export class NonFungibleTokenComponent implements OnInit, OnDestroy {
  @Input()nonFungibleToken: NonFungibleToken;
  http: HttpClient;
  activatedRoute: ActivatedRoute;

  constructor(activatedRoute: ActivatedRoute) {
    this.activatedRoute = activatedRoute;
  }

  ngOnDestroy(): void {
    // this.activatedRoute.paramMap.subscribe(async params => {
    //   this.address = params.get('address');});
  }

  ngOnInit(): void {
    debugger;
    let result: any = this.http.get(this.nonFungibleToken.Uri).subscribe()
    console.log(result);
  }

}
