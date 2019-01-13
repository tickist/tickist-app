import {Component, OnDestroy, OnInit} from '@angular/core';
import {ProjectService} from '../../services/project.service';
import {SimpleUser} from '../../models/user';
import {ConfigurationService} from '../../services/configuration.service';
import {environment} from '../../../environments/environment';

@Component({
    selector: 'tickist-team',
    templateUrl: './team.component.html',
    styleUrls: ['./team.component.scss']
})
export class TeamComponent implements OnInit, OnDestroy {
    team: SimpleUser[];
    staticUrl: string;

    constructor(private projectService: ProjectService, private configurationService: ConfigurationService) {
    }

    ngOnInit() {
        this.configurationService.changeOpenStateLeftSidenavVisibility('close');
        this.configurationService.changeOpenStateRightSidenavVisibility('close');
        this.staticUrl = environment['staticUrl'];
        this.projectService.team$.subscribe((team) => {
            this.team = team;
        });
    }

    ngOnDestroy(): void {
        this.configurationService.updateLeftSidenavVisibility();
        this.configurationService.updateRightSidenavVisibility();
        this.configurationService.updateAddTaskComponentVisibility(true);
    }

}
