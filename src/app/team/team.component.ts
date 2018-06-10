import {Component, OnInit} from '@angular/core';
import {ProjectService} from '../services/project-service';
import {SimplyUser} from '../models/user';
import {ConfigurationService} from '../services/configurationService';
import {environment} from '../../environments/environment';

@Component({
    selector: 'tickist-team',
    templateUrl: './team.component.html',
    styleUrls: ['./team.component.scss']
})
export class TeamComponent implements OnInit {
    team: SimplyUser[];
    staticUrl: string;

    constructor(protected projectService: ProjectService, protected configurationService: ConfigurationService) {
    }

    ngOnInit() {
        this.staticUrl = environment['staticUrl'];
        this.projectService.team$.subscribe((team) => {
            this.team = team;
        });
    }

}
