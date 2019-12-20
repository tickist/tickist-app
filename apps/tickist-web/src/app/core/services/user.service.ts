import * as _ from 'lodash';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {Store} from '@ngrx/store';
import {AppStore} from '../../store';
import {SimpleUser, User} from '@data/users/models';
import {TasksFiltersService} from './tasks-filters.service';
import {selectLoggedInUser} from '../selectors/user.selectors';
import {Logout} from '../actions/auth.actions';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFireAuth} from '@angular/fire/auth';
import {finalize} from 'rxjs/operators';
import {AngularFireStorage} from '@angular/fire/storage';
import {changeAvatar} from '../actions/user.actions';
import {USER_AVATAR_PATH} from '@data/users/config-user';

const userCollectionName = 'users';

@Injectable()
export class UserService {
    user$: Observable<User>;
    team$: Observable<SimpleUser[]>;
    uploadPercent: Observable<number>;
    downloadURL: Observable<string>;
    IMAGE_PATH = '/images/';

    constructor(private store: Store<AppStore>, private db: AngularFirestore, private storage: AngularFireStorage,
                private tasksFiltersService: TasksFiltersService, private authFire: AngularFireAuth) {
        this.user$ = this.store.select(selectLoggedInUser);
        this.team$ = this.store.select(s => s.team);

    }


    loadUser(uid?): any {
        if (_.isNil(uid)) {
            this.store.dispatch(new Logout());
        } else {
            return this.db.collection('users').doc(uid).get();


            // return this.http.get(`${environment['apiUrl']}/user/${userId}/`)
            //     .pipe(map((payload: IUserApi) => {
            //         return new User(payload);
            //         // this.tasksFiltersService.createDefaultFilters(user);
            //         // this.tasksFiltersService.loadTasksFilters(user);
            //         // this.tasksFiltersService.loadCurrentTasksFilters(user);
            //     }));
        }
    }

    updateUser(user: User) {
        return this.db.collection(userCollectionName)
            .doc(this.authFire.auth.currentUser.uid)
            .update(JSON.parse(JSON.stringify(user)));

        // .set(JSON.parse(JSON.stringify(user)));
        // return this.http.put<IUserApi>(`${environment['apiUrl']}/user/${user.id}/`, userToSnakeCase(user));
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

    changePassword(values: any) {
        const object = {};
        _.keys(values).forEach(key => {
            object[_.snakeCase(key)] = values[key];
        });
        const userID = localStorage.getItem('USER_ID');
        // return this.http.put(`${environment.apiUrl}/user/${userID}/changepassword/`, object);
    }

    changeUserAvatar(avatar: File, user: User) {
        const avatarPath = USER_AVATAR_PATH + user.id + '/' + avatar.name;
        const fileRef = this.storage.ref(avatarPath);
        const task = this.storage.upload(avatarPath, avatar);

        // observe percentage changes
        //  this.uploadPercent = task.percentageChanges();
        // get notified when the download URL is available
        task.snapshotChanges().pipe(
            finalize(() => {
                this.downloadURL = fileRef.getDownloadURL();
                this.downloadURL.subscribe(() => (this.store.dispatch(changeAvatar({avatarUrl: avatar.name}))));
            })
            )
            .subscribe();

        return task.percentageChanges();
    }

    checkNewTeamMember(email) {
        const userID = localStorage.getItem('USER_ID');
        // return this.http.post(`${environment.apiUrl}/user/${userID}/checkteammember/`, {'email': email});
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
