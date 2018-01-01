import { Component, OnInit } from '@angular/core';
import {ConfigurationService} from '../services/configurationService';

@Component({
  selector: 'tickist-show-api-error',
  templateUrl: './show-api-error.component.html',
  styleUrls: ['./show-api-error.component.scss']
})
export class ShowApiErrorComponent implements OnInit {
    isVisible = false;
    
    constructor(protected configurationService: ConfigurationService) { }

    ngOnInit() {
        this.configurationService.detectApiError$.subscribe(isVisible => {
            this.isVisible = isVisible;
        });
    }

}
