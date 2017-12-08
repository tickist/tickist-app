import {Component, OnInit} from '@angular/core';
import {ConfigurationService} from '../services/configurationService';


@Component({
  selector: 'show-api-error',
  templateUrl: 'showApiError.html',
  styleUrls: ['showApiError.scss']
})
export class ShowApiErrorComponent implements OnInit {
  isVisible: boolean;

  constructor(private configurationService: ConfigurationService) {

  }
  ngOnInit() {
    this.configurationService.detectApiError$.subscribe((isVisible: boolean) => {
      this.isVisible = isVisible;
      if (isVisible) {
        setTimeout(() => {
          this.isVisible = false;
        }, 5000);
      }
    });
  }
  close() {
    this.isVisible = false;
  }
}
