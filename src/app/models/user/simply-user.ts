import {Api} from '../commons';
import {SimpleProject} from '../projects/simply-project';

export class SimplyUser extends Api {
  id: number;
  username: string;
  email: string;
  avatar: string;
  avatarUrl: string;
  shareWith: SimpleProject[] = [];

  constructor(user) {
    super();
    this.id = user.id;
    this.username = user.username;
    this.email = user.email;
    this.avatar = user.avatar;
    this.avatarUrl = user.avatar_url;
    if (user.share_with) {
      user.share_with.forEach((project) => {
        this.shareWith.push(new SimpleProject(project));
      });
    }
  }

}


