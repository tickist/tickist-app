import { Component, OnInit } from '@angular/core';
import {ConfigurationService} from '../services/configurationService';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit {
  dayQuota = '';
  dayAuthor = '';
  quotas = [];
  facebookFanpage: '';
  twitter: '';
  googlePlus: '';
  constructor(protected configurationService: ConfigurationService) {
    this.quotas = [
      {
        'author': 'Ashley Ormon',
        'quota': 'You can`t make up for lost time. You can only do better in the future.'},
      {
        'author': 'Pandora Poikilos',
        'quota': 'Procrastination is the foundation of all disasters.'},
      {
        'author': 'Dawn Gluskin',
        'quota': 'Time is one of our most precious resources that we can never get back. Manage it wisely.'
      }
    ];

  }
  ngOnInit() {
    const value = Math.floor((Math.random() * this.quotas.length));
    this.dayQuota = this.quotas[value].quota;
    this.dayAuthor = this.quotas[value].author;
    this.twitter = this.configurationService.loadConfiguration()['commons']['TWITTER'];
    this.facebookFanpage = this.configurationService.loadConfiguration()['commons']['FACEBOOK_FANPAGE'];
    this.googlePlus = this.configurationService.loadConfiguration()['commons']['GOOGLE_PLUS'];
  }

  getFullYear() {
    const d = new Date();
    return d.getFullYear();
  };
}
