import { Component, HostBinding, OnDestroy, ViewEncapsulation } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { EnvironmentService } from '../../services';
import { UIState } from '../../services/ui-state.service';

@Component({
    selector: 'app-about',
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class AboutComponent implements OnDestroy {
    // @HostBinding('class.changes') hostClass = true;

    constructor(public uiState: UIState,
        public env: EnvironmentService,
        public translate: TranslateService) {
        this.uiState.showBackButton = true;
        this.uiState.goBackHome = false;
    }

    async ngOnInit() {
      this.uiState.title = await this.translate.get('Settings.About').toPromise();
    }

    ngOnDestroy() {
    }
}
