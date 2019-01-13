import {Api} from '../../models/commons';


export class PendingUser extends Api {
  is_active: boolean;
  username: string;
  avatarUrl: string;
  email: string;
  status: string;

  constructor(user) {
    super();
    this.username = user.username;
    this.avatarUrl = user.avatar_url;
    this.email = user.email;
    this.status = user.status;

  }
}
