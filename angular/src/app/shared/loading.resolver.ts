// import { Injectable } from '@angular/core';
// import {
//     Resolve,
//     ActivatedRouteSnapshot,
//     RouterStateSnapshot
// } from '@angular/router';
// import { Observable } from 'rxjs';
// import { ApplicationState } from '../services/application-state.service';

// @Injectable({
//     providedIn: 'root'
// })
// export class LoadingResolverService implements Resolve<any> {
//     constructor(
//         private appState: ApplicationState
//     ) { }
//     async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<Observable<any> | Observable<never>> {
//         var cb = new Promise<any>((resolve, reject) => {
//             this.appState.load(() => {
//                 resolve(null);
//             });
//         });

//         return cb;
//     }
// }
