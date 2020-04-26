import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit} from '@angular/core';
import {AngularFireStorage} from '@angular/fire/storage';
import {Observable, of, Subject, throwError} from 'rxjs';
import {DEFAULT_USER_AVATAR, USER_AVATAR_PATH} from '@data/users/config-user';
import {delay, mergeMap, retryWhen, takeUntil} from 'rxjs/operators';

@Component({
    selector: 'tickist-user-avatar',
    templateUrl: './user-avatar.component.html',
    styleUrls: ['./user-avatar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserAvatarComponent implements OnInit, OnChanges, OnDestroy {
    @Input() userId: string;
    @Input() username?: string;
    @Input() avatarUrl: string;
    @Input() size = '32x32';
    @Input() styles?: { value: string, name: string }[] = [];
    MAX_AVATAR_SIZE = '200x200';
    imgStyle: any = {};
    spinnerDiameter = 32;
    url: string;
    private ngUnsubscribe: Subject<void> = new Subject<void>();


    constructor(private storage: AngularFireStorage, private cd: ChangeDetectorRef) {
    }

    ngOnInit() {
        const [width, height] = this.size.split('x');
        this.imgStyle = {'width.px': width, 'height.px': height};
        this.spinnerDiameter = Math.max(parseInt(width, 10), parseInt(height, 10));
        this.styles.forEach(style => {
            this.imgStyle[style.name] = style.value;
        });
    }

    ngOnChanges() {
        debugger;
        if (this.avatarUrl === DEFAULT_USER_AVATAR) {
            this.url = this.addMaxAvatarSizeToAvatarUrl();
        } else if (this.validURL(this.avatarUrl)) {
            this.url = this.avatarUrl;
        } else {
            this.updateUrlFromFirebaseStorage();
        }
    }

    handleError($event) {
        this.url = '';
        debugger;
        setTimeout(() => {
            this.updateUrlFromFirebaseStorage();
        }, 1000);
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    private createAvatarPath(): string {
        return `${USER_AVATAR_PATH}${this.userId}/${this.addMaxAvatarSizeToAvatarUrl()}`;
    }

    private addMaxAvatarSizeToAvatarUrl() {
        const extension = this.avatarUrl.slice(-4);
        return this.avatarUrl.slice(0, -4) + '_' + this.MAX_AVATAR_SIZE + extension;
    }

    private updateUrlFromFirebaseStorage() {
        let retries = 3;
        this.url = localStorage.getItem(this.createAvatarPath());
        this.storage.ref(this.createAvatarPath()).getDownloadURL().pipe(
            retryWhen((errors: Observable<any>) =>
                errors.pipe(
                    delay(1000),
                    mergeMap(error => retries-- > 0 ? of(error) : throwError(new Error('max retries'))
                    ))
            ),
            takeUntil(this.ngUnsubscribe)
        ).subscribe(avatarUrl => {
            const userAvatarPath = localStorage.getItem(this.createAvatarPath());
            if (userAvatarPath !== avatarUrl) {
                localStorage.setItem(this.createAvatarPath(), avatarUrl);
            }
            this.url = avatarUrl;
            this.cd.detectChanges();
        });
    }

    private validURL(str) {
        const pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
            '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
            '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
        return !!pattern.test(str);
    }

}
