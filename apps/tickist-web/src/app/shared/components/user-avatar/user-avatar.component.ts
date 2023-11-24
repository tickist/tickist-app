import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
} from "@angular/core";
import { Storage } from "@angular/fire/storage";
import { Subject } from "rxjs";
import { DEFAULT_USER_AVATAR, USER_AVATAR_PATH } from "@data/users/config-user";

@Component({
    selector: "tickist-user-avatar",
    templateUrl: "./user-avatar.component.html",
    styleUrls: ["./user-avatar.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserAvatarComponent implements OnInit, OnChanges, OnDestroy {
    @Input() userId: string;
    @Input() username?: string;
    @Input() avatarUrl: string;
    @Input() size = "32x32";
    @Input() styles?: { value: string; name: string }[] = [];
    @Output() avatarIsEmpty = new EventEmitter<string>();
    maxAvatarSize = "200x200";
    imgStyle: any = {};
    spinnerDiameter = 32;
    url: string;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(
        private storage: Storage,
        private cd: ChangeDetectorRef,
    ) {}

    ngOnInit() {
        const [width, height] = this.size.split("x");
        // eslint-disable-next-line @typescript-eslint/naming-convention
        this.imgStyle = { "width.px": width, "height.px": height };
        this.spinnerDiameter = Math.max(parseInt(width, 10), parseInt(height, 10));
        this.styles.forEach((style) => {
            this.imgStyle[style.name] = style.value;
        });
    }

    ngOnChanges() {
        if (this.avatarUrl === DEFAULT_USER_AVATAR) {
            this.url = this.addMaxAvatarSizeToAvatarUrl();
        } else if (this.validURL(this.avatarUrl)) {
            this.url = this.avatarUrl;
        } else if (this.avatarUrl === "" || this.avatarUrl === undefined) {
            this.avatarIsEmpty.emit();
        } else {
            this.updateUrlFromFirebaseStorage();
        }
    }

    handleError() {
        this.url = "";
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
        return this.avatarUrl.slice(0, -4) + "_" + this.maxAvatarSize + extension;
    }

    private updateUrlFromFirebaseStorage() {
        // @TODO fix it nie działa
        // let retries = 3;
        // this.url = localStorage.getItem(this.createAvatarPath());
        // this.storage
        //     .ref(this.createAvatarPath())
        //     .getDownloadURL()
        //     .pipe(
        //         retryWhen((errors: Observable<any>) =>
        //             errors.pipe(
        //                 delay(5000),
        //                 mergeMap((error) => {
        //                     if (retries-- > 0) {
        //                         return of(error);
        //                     } else {
        //                         this.url = localStorage.getItem(
        //                             this.createAvatarPath()
        //                         );
        //                         this.cd.detectChanges();
        //                     }
        //                 })
        //             )
        //         ),
        //         takeUntil(this.ngUnsubscribe)
        //     )
        //     .subscribe((avatarUrl) => {
        //         const userAvatarPath = localStorage.getItem(
        //             this.createAvatarPath()
        //         );
        //         if (userAvatarPath !== avatarUrl) {
        //             localStorage.setItem(this.createAvatarPath(), avatarUrl);
        //         }
        //         this.url = avatarUrl;
        //         this.cd.detectChanges();
        //     });
    }

    private validURL(str) {
        // eslint-disable-next-line max-len
        const regexQuery =
            "^(https?://)?(www\\.)?([-a-z0-9]{1,63}\\.)*?[a-z0-9][-a-z0-9]{0,61}[a-z0-9]\\.[a-z]{2,6}(/[-\\w@\\+\\.~#\\?&/=%]*)?$";
        const pattern = new RegExp(regexQuery, "i");
        return !!pattern.test(str);
    }
}
