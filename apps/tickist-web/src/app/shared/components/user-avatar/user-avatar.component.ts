import {AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, OnInit, Renderer2, ViewChild} from '@angular/core';
import {AngularFireStorage} from '@angular/fire/storage';
import {Observable, of} from 'rxjs';
import {DEFAULT_USER_AVATAR, USER_AVATAR_PATH} from '@data/users/config-user';

@Component({
    selector: 'tickist-user-avatar',
    templateUrl: './user-avatar.component.html',
    styleUrls: ['./user-avatar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserAvatarComponent implements OnInit, OnChanges, AfterViewInit {
    @Input() userId: string;
    @Input() username?: string;
    @Input() avatarUrl: string;
    @Input() size: string;
    @Input() styles?: {value:string, name:string}[];
    @ViewChild('img', {read: ElementRef, static: false}) img: ElementRef;
    MAX_AVATAR_SIZE = '200x200';
    avatar: Observable<string>;

    constructor(private storage: AngularFireStorage, private renderer: Renderer2) {
    }

    ngOnInit() {
    }

    ngOnChanges() {
        if (this.avatarUrl === DEFAULT_USER_AVATAR) {
            this.avatar = of(this.addMaxAvatarSizeToAvatarUrl())
        } else {
            this.avatar = this.storage.ref(this.createAvatarPath()).getDownloadURL();
        }
    }

    ngAfterViewInit() {
        const [width, height] = this.size.split("x");
        this.renderer.setStyle(this.img.nativeElement, 'width', `${width}px`);
        this.renderer.setStyle(this.img.nativeElement, 'height',`${height}px`);
        if (this.styles) {
            this.styles.forEach(style => {
                this.renderer.setStyle(this.img.nativeElement, style.name, style.value);
            })
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
