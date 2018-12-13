import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {SimpleUser} from '../models/user';
import {environment} from '../../environments/environment';

@Component({
  selector: 'tickist-user-avatar',
  templateUrl: './user-avatar.component.html',
  styleUrls: ['./user-avatar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserAvatarComponent implements OnInit {
  @Input() user: SimpleUser;
  staticUrl: string;

  constructor() { }

  ngOnInit() {
     this.staticUrl = environment['staticUrl'];
  }

}
