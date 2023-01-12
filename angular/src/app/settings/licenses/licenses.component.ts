import { Component, HostBinding, OnDestroy, OnInit, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { retry, tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { UIState } from 'src/app/services/ui-state.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-licenses',
  templateUrl: './licenses.component.html',
  styleUrls: ['./licenses.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class LicensesComponent implements OnDestroy, OnInit {
  @HostBinding('class.licenses') hostClass = true;

  selectedContent!: SafeHtml;

  constructor(public uiState: UIState, private readonly cd: ChangeDetectorRef, private readonly sanitizer: DomSanitizer, private readonly http: HttpClient, public translate: TranslateService) {
    this.uiState.showBackButton = true;
    this.uiState.goBackHome = false;
  }

  ngOnDestroy() {}

  async ngOnInit() {
    this.uiState.title = await this.translate.get('Settings.ThirdPartyLicenses').toPromise();
    this.showContent('3rdpartylicenses.txt');
  }

  private showContent(contentUrl: string) {
    this.http
      .get(contentUrl, { responseType: 'text' })
      .pipe(
        retry(2),
        tap(
          (data) => {
            this.selectedContent = data;
            this.cd.markForCheck();
          },
          (error) => {
            this.selectedContent = `Unable to get content (${error.statusText})`;
            this.cd.markForCheck();
          }
        )
      )
      .subscribe();
  }
}
