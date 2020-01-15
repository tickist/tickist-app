import {AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, OnInit, Renderer2, ViewChild} from '@angular/core';
import {AngularFireStorage} from '@angular/fire/storage';
import {Observable, of, throwError} from 'rxjs';
import {DEFAULT_USER_AVATAR, USER_AVATAR_PATH} from '@data/users/config-user';
import {catchError, delay, mergeMap, retry, retryWhen} from 'rxjs/operators';

@Component({
    selector: 'tickist-user-avatar',
    templateUrl: './user-avatar.component.html',
    styleUrls: ['./user-avatar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserAvatarComponent implements OnInit, OnChanges {
    @Input() userId: string;
    @Input() username?: string;
    @Input() avatarUrl: string;
    @Input() size = '32x32';
    @Input() styles?: { value: string, name: string }[] = [];
    MAX_AVATAR_SIZE = '200x200';
    imgStyle: any = {};
    avatar$: Observable<string>;

    constructor(private storage: AngularFireStorage) {
    }

    ngOnInit() {
        const [width, height] = this.size.split('x');
        this.imgStyle = {'width.px': width, 'height.px': height};
        this.styles.forEach(style => {
            this.imgStyle[style.name] = style.value;
        });
    }

    ngOnChanges() {
        let retries = 3;
        if (this.avatarUrl === DEFAULT_USER_AVATAR) {
            this.avatar$ = of(this.addMaxAvatarSizeToAvatarUrl());
        } else {
            this.avatar$ = this.storage.ref(this.createAvatarPath()).getDownloadURL().pipe(
                retryWhen((errors: Observable<any>) =>
                    errors.pipe(
                        delay(1000),
                        mergeMap(error => retries-- > 0 ? of(error) : throwError(new Error('max retries'))
                        ))
                ))
        }
    }

    private createAvatarPath(): string {
        return `${USER_AVATAR_PATH}${this.userId}/${this.addMaxAvatarSizeToAvatarUrl()}`;
    }

    private addMaxAvatarSizeToAvatarUrl() {
        const extension = this.avatarUrl.slice(-4);
        return this.avatarUrl.slice(0, -4) + '_' + this.MAX_AVATAR_SIZE + extension;
    }

}
