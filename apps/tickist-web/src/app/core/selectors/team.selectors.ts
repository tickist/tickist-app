import {createSelector} from '@ngrx/store';
import {selectAllProjects} from './projects.selectors';
import {ShareWithPendingUser, ShareWithUser} from '@data/projects';


export const selectTeam = createSelector(
    selectAllProjects,
    projects => {
        const team = new Set<ShareWithUser | ShareWithPendingUser>();
        const teamIds = new Set<string>();
        projects.forEach(project => {
            project.shareWith.forEach(user => {
                if (!teamIds.has(user.id)) {
                    teamIds.add(user.id);
                    team.add({id: user.id, username: user.username, avatarUrl: (<ShareWithUser> user).avatarUrl, email: user.email})
                }
            })
        });
        return Array.from(team)
    }
);
