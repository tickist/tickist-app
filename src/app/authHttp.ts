// // import {AuthConfig, AuthHttp} from "angular2-jwt";
// // import {Router, RouterStateSnapshot, RouterState} from '@angular/router';
// // import {ConfigurationService} from "./services/configurationService";
// // import {Http, Request, RequestOptions, RequestOptionsArgs, Response} from '@angular/http';
// // import {Observable} from 'rxjs/Observable';
// //
// //
// // class MyAuthHttp extends AuthHttp {
// //   state: RouterState;
// //   snapshot: RouterStateSnapshot;
// //
// //   constructor(options: AuthConfig, http: Http, private configurationService: ConfigurationService, private router: Router, defOpts?: RequestOptions) {
// //     super(options, http);
// //     this.state = this.router.routerState;
// //     this.snapshot = this.state.snapshot;
// //   }
// //
// //   private response(res: Response): Observable<any> {
// //     try {
// //       if (res.status === 401 || res.status === 403) {
// //         console.log(this.snapshot.url);
// //         if (this.snapshot.url !== '/login') {
// //           this.router.navigate(['login']);
// //         }
// //         console.log('The authentication session expires or the user is not authorised. Force remove token and username from localstorage.');
// //         localStorage.removeItem('JWT');
// //         localStorage.removeItem('USERNAME');
// //       }
// //       if (res.status >= 401) {
// //         this.configurationService.updateDetectApiError(true);
// //       } else {
// //         this.configurationService.updateDetectApiError(false);
// //       }
// //     } catch (err) {
// //       console.warn('AuthenticatedHttpService._handle401');
// //       console.error(err);
// //     }
// //
// //     return Observable.throw(res);
// //   }
// //
// //   get(url: string, options?: RequestOptionsArgs): Observable<Response> {
// //     return super.get(url, options).catch(res => this.response(res));
// //   }
// //
// //   post(url: string, body: any, options?: RequestOptionsArgs): Observable<Response> {
// //     return super.post(url, body, options).catch(res => this.response(res));
// //   }
// //
// //   put(url: string, body: any, options?: RequestOptionsArgs): Observable<Response> {
// //     return super.put(url, body, options).catch(res => this.response(res));
// //   }
// //
// //   delete(url: string, options?: RequestOptionsArgs): Observable<Response> {
// //     return super.delete(url, options).catch(res => this.response(res));
// //   }
// //
// //   patch(url: string, body: any, options?: RequestOptionsArgs): Observable<Response> {
// //     return super.patch(url, body, options).catch(res => this.response(res));
// //   }
// //
// //   options(url: string, options?: RequestOptionsArgs): Observable<Response> {
// //     return super.options(url, options).catch(res => this.response(res));
// //
// //   }
// //
// // }
// //
// //
// // export function AUTH_HTTP_FACTORY(http, internalService, router) {
// //   return new MyAuthHttp(new AuthConfig({
// //     headerName: 'Authorization',
// //     headerPrefix: '',
// //     tokenName: 'JWT',
// //     tokenGetter: (() => localStorage.getItem('JWT')),
// //     globalHeaders: [{'Content-Type': 'application/json'}],
// //     noJwtError: true,
// //     noTokenScheme: true
// //   }), http, internalService, router);
// // };
// // // export function authHttpServiceFactory(http: Http, options: RequestOptions) {
// // //   return new AuthHttp(new AuthConfig({
// // //     tokenName: 'token',
// // //         tokenGetter: (() => sessionStorage.getItem('token')),
// // //         globalHeaders: [{'Content-Type':'application/json'}],
// // //      }), http, options);
// // // }
// import {AuthConfig, AuthHttp} from "angular2-jwt";
// import {Router, RouterStateSnapshot, RouterState} from '@angular/router';
// import {ConfigurationService} from "./services/configurationService";
// import {Http, Request, RequestOptions, RequestOptionsArgs, Response} from '@angular/http';
// import {Observable} from 'rxjs/Observable';
//
//
// class MyAuthHttp extends AuthHttp {
//   state: RouterState;
//   snapshot: RouterStateSnapshot;
//
//   constructor(options: AuthConfig, http: Http, private configurationService: ConfigurationService, private router: Router, defOpts?: RequestOptions) {
//     super(options, http);
//     this.state = this.router.routerState;
//     this.snapshot = this.state.snapshot;
//   }
//
//   private response(res: Response): Observable<any> {
//     try {
//       if (res.status === 401 || res.status === 403) {
//         console.log(this.snapshot.url);
//         if (this.snapshot.url !== '/login') {
//           this.router.navigate(['login']);
//         }
//         console.log('The authentication session expires or the user is not authorised. Force remove token and username from localstorage.');
//         localStorage.removeItem('JWT');
//         localStorage.removeItem('USERNAME');
//       }
//       if (res.status >= 401) {
//         this.configurationService.updateDetectApiError(true);
//       } else {
//         this.configurationService.updateDetectApiError(false);
//       }
//     } catch (err) {
//       console.warn('AuthenticatedHttpService._handle401');
//       console.error(err);
//     }
//
//     return Observable.throw(res);
//   }
//
//   get(url: string, options?: RequestOptionsArgs): Observable<Response> {
//     return super.get(url, options).catch(res => this.response(res));
//   }
//
//   post(url: string, body: any, options?: RequestOptionsArgs): Observable<Response> {
//     return super.post(url, body, options).catch(res => this.response(res));
//   }
//
//   put(url: string, body: any, options?: RequestOptionsArgs): Observable<Response> {
//     return super.put(url, body, options).catch(res => this.response(res));
//   }
//
//   delete(url: string, options?: RequestOptionsArgs): Observable<Response> {
//     return super.delete(url, options).catch(res => this.response(res));
//   }
//
//   patch(url: string, body: any, options?: RequestOptionsArgs): Observable<Response> {
//     return super.patch(url, body, options).catch(res => this.response(res));
//   }
//
//   options(url: string, options?: RequestOptionsArgs): Observable<Response> {
//     return super.options(url, options).catch(res => this.response(res));
//
//   }
//
// }
//
//
// export function AUTH_HTTP_FACTORY(http, internalService, router) {
//   return new MyAuthHttp(new AuthConfig({
//     headerName: 'Authorization',
//     headerPrefix: '',
//     tokenName: 'JWT',
//     tokenGetter: (() => localStorage.getItem('JWT')),
//     globalHeaders: [{'Content-Type': 'application/json'}],
//     noJwtError: true,
//     noTokenScheme: true
//   }), http, internalService, router);
// };
// // export function authHttpServiceFactory(http: Http, options: RequestOptions) {
// //   return new AuthHttp(new AuthConfig({
// //     tokenName: 'token',
// //         tokenGetter: (() => sessionStorage.getItem('token')),
// //         globalHeaders: [{'Content-Type':'application/json'}],
// //      }), http, options);
// // }
