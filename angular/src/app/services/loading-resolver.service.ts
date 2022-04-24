import { Injectable } from '@angular/core';
import {
    Resolve,
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
    Router
} from '@angular/router';
import { Observable } from 'rxjs';
import { UIState } from './ui-state.service';

@Injectable({
    providedIn: 'root'
})
export class LoadingResolverService implements Resolve<any> {
    constructor(
        public uiState: UIState,
        private router: Router
    ) {
    }
    async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<Observable<any> | Observable<never>> {
        if (!this.uiState.initialized) {
            this.router.navigateByUrl('/loading');
        }

        return null;
    }
}
