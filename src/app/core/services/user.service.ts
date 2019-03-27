import * as _ from 'lodash';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {environment} from '../../../environments/environment';
import {AppStore} from '../../store';
import {User, UserLogin, SimpleUser} from '../models';
import {MatSnackBar} from '@angular/material';
import {HttpClient} from '@angular/common/http';
import {map} from 'rxjs/operators';
import {TasksFiltersService} from './tasks-filters.service';
import {IUserApi} from '../../models/user-api.interface';
import {ISimpleUserApi} from '../../models/simple-user-api.interface';
import {selectLoggedInUser} from '../selectors/user.selectors';
import {Logout} from '../actions/auth.actions';
import {userToSnakeCase} from '../utils/userToSnakeCase';



@Injectable()
export class UserService {
    user$: Observable<User>;
    team$: Observable<SimpleUser[]>;

    constructor(private http: HttpClient, private store: Store<AppStore>,
                public snackBar: MatSnackBar, protected tasksFiltersService: TasksFiltersService) {
        this.user$ = this.store.select(selectLoggedInUser);

        this.team$ = this.store.select(s => s.team);

    }

    loadUser(userId?): any {
        if (_.isNil(userId)) {
            this.store.dispatch(new Logout());
        } else {
            return this.http.get(`${environment['apiUrl']}/user/${userId}/`)
                .pipe(map((payload: IUserApi) => {
                    return new User(payload);
                    // this.tasksFiltersService.createDefaultFilters(user);
                    // this.tasksFiltersService.loadTasksFilters(user);
                    // this.tasksFiltersService.loadCurrentTasksFilters(user);
                }));
        }
    }

    updateUser(user: User) {
        return this.http.put<IUserApi>(`${environment['apiUrl']}/user/${user.id}/`, userToSnakeCase(user))
            // .subscribe(payload => {
            //     if (!withoutSnackBar) {
            //         this.snackBar.open('User data has been update successfully', '', {
            //             duration: 2000,
            //         });
            //     }
            //
            //     // this.store.dispatch(new userAction.UpdateUser(new User(payload)));
            // });
    }

    loadTeam(): any {
        const userID = localStorage.getItem('USER_ID');
        if (userID == null) {
            this.store.dispatch(new Logout());
        } else {
            return this.http.get<ISimpleUserApi[]>(`${environment['apiUrl']}/user/${userID}/teamlist/`)
                .pipe(
                    map(payload => {
                        return payload.map(user => new SimpleUser(user));
                    })
                );
        }
    }

    login(user: UserLogin) {
        return this.http.post(`${environment.apiUrl}/api-token-auth/`, user);
    }

    changePassword(values: any) {
        const  object = {};
        _.keys(values).forEach(key => {
            object[_.snakeCase(key)] = values[key];
        });
        const userID = localStorage.getItem('USER_ID');
        return this.http.put(`${environment.apiUrl}/user/${userID}/changepassword/`, object);
    }

    changeAvatar(avatar: File) {
        const userID = localStorage.getItem('USER_ID');
        return new Promise((resolve, reject) => {

            const xhr: XMLHttpRequest = new XMLHttpRequest();

            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        resolve(JSON.parse(xhr.response));
                    } else {
                        reject(xhr.response);
                    }
                }
            };

            xhr.open('POST', `${environment.apiUrl}/user/${userID}/changeavatar/`, true);
            xhr.setRequestHeader('Authorization', localStorage.getItem('JWT'));
            const formData = new FormData();
            formData.append('file', avatar, avatar.name);
            xhr.send(formData);
        });
    }

    checkNewTeamMember(email) {
        const userID = localStorage.getItem('USER_ID');
        return this.http.post(`${environment.apiUrl}/user/${userID}/checkteammember/`, {'email': email});
    }

//  check_email: function (email) {
//             var url = ENV.apiEndpoint + "/check_email/";
//             var defer = $q.defer();
//             $http({method: 'POST', url: url, data: {'email': email}}).
//                 success(function (data, status, headers, config) {
//                     defer.resolve(data);
//                 }).
//                 error(function (data, status, headers, config) {
//                     defer.reject(data);
//                  });
//             return defer.promise;
//         },


}

// check_teammember = function (email) {
//         var defer = $q.defer();
//         $http({
//             method: 'POST',
//             url: api_url + $window.sessionStorage.user + "/checkteammember/",
//             data: email
//         }).
//             success(function (data, status, headers, config) {
//                 defer.resolve(data);
//
//             }).error(function (data, status, headers, config) {
//                 defer.reject(data);
//             });
//         return defer.promise;
//
//     };
//
// change_avatar_user_on_server = function ($files) {
//         for (var i = 0; i < $files.length; i++) {
//             var file = $files[i];
//             console.log(file);
//             var defer = $q.defer();
//             var upload = $upload.upload({
//                 url: '/user/' + $window.sessionStorage.user + '/changeavatar/', //upload.php script, node.js route, or servlet url
//                 method: 'POST',
//                 //headers: {'Content-Type': file.type},
//                 //withCredentials: true,
//                 data: {},
//                 file: file, // or list of files ($files) for html5 only
//                 //fileName: 'doc.jpg' or ['1.jpg', '2.jpg', ...] // to modify the name of the file(s)
//                 // customize file formData name ('Content-Desposition'), server side file variable name.
//                 //fileFormDataName: myFile, //or a list of names for multiple files (html5). Default is 'file'
//                 // customize how data is added to formData. See #40#issuecomment-28612000 for sample code
//                 //formDataAppender: function(formData, key, val){}
//             }).progress(function (evt) {
//                 console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
//             }).success(function (data, status, headers, config) {
//                 // file is uploaded successfully
//                 console.log(data);
//
//                 defer.resolve(data);
//             });
//             //.error(...)
//             //.then(success, error, progress);
//             // access or attach event listeners to the underlying XMLHttpRequest.
//             //.xhr(function(xhr){xhr.upload.addEventListener(...)})
//         }
//         /* alternative way of uploading, send the file binary with the file's content-type.
//          Could be used to upload files to CouchDB, imgur, etc... html5 FileReader is needed.
//          It could also be used to monitor the progress of a normal http post/put request with large data*/
//         // $scope.upload = $upload.http({...})  see 88#issuecomment-31366487 for sample code.
//         return defer.promise;
//     },
//
//      check_email: function (email) {
//             var url = ENV.apiEndpoint + "/check_email/";
//             var defer = $q.defer();
//             $http({method: 'POST', url: url, data: {'email': email}}).
//                 success(function (data, status, headers, config) {
//                     defer.resolve(data);
//                 }).
//                 error(function (data, status, headers, config) {
//                     defer.reject(data);
//                  });
//             return defer.promise;
//         },
//
//         send_new_password: function (data) {
//             var url = ENV.apiEndpoint + "/user/forgot_password/";
//             var defer = $q.defer();
//             $http({method: 'POST', url: url, data: data}).
//                 success(function (data, status, headers, config) {
//                     defer.resolve(data);
//                 })
//                 .error(function (data, status, headers, config) {
//                     defer.reject(data);
//                 });
//             return defer.promise;
//         },
//         login_google_plus: function (data) {
//             var url = ENV.apiEndpoint + "/complete/google-plus/",
//                 defer = $q.defer();
//             //debugger;
//             url = "/test/";
//
//             $http({
//                 method: 'POST',
//                 url: url,
//                 data: data
//             }).
//                 success(function (data, status, headers, config) {
//                     defer.resolve(data);
//                     $window.location.reload();
//                 })
//                 .error(function (data, status, headers, config) {
//                     defer.reject(data);
//                 });
//             return defer.promise;
//         }
//
//
//
//
//     facebook_login = function(){
//         var deferred = $q.defer();
//         //first check if we already have logged in
//         FB.getLoginStatus(function(response) {
//             if (response.status === 'connected') {
//                 // the user is logged in and has authenticated your
//                 // app
//                 console.log("fb user already logged in");
//                 deferred.resolve(response);
//             } else {
//                 // the user is logged in to Facebook,
//                 // but has not authenticated your app
//                 FB.login(function(response){
//                     if(response.authResponse){
//                         console.log("fb user logged in");
//                         resolve(null, response, deferred);
//                     }else{
//                         console.log("fb user could not log in");
//                         resolve(response.error, null, deferred);
//                     }
//                 });
//             }
//         });
//
//         return deferred.promise;
//     };
//
//     social_server_login = function(data) {
//         var url = ENV.apiEndpoint + "/sociallogin/";
//         var defer = $q.defer();
//         $http({method: 'POST', url: url, data: data}).
//             success(function (data, status, headers, config) {
//                 defer.resolve(data);
//                 $window.sessionStorage.token = data.token;
//                 $window.sessionStorage.user = data.user_id;
//             })
//             .error(function (data, status, headers, config) {
//                 defer.reject(data);
//                 delete $window.sessionStorage.token;
//                 delete $window.sessionStorage.user;
//             });
//         return defer.promise;
//     };
//
