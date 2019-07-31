


export class PendingUser {
  is_active: boolean;
  username: string;
  avatarUrl: string;
  email: string;
  status: string;

  constructor(user) {
    this.username = user.username;
    this.avatarUrl = user.avatar_url;
    this.email = user.email;
    this.status = user.status;

  }
}
