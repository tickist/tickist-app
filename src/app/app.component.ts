import {Component, OnInit} from '@angular/core';
import 'hammerjs'; // Recommended
import gitInfo from '../git-version.json';
import {SwUpdate} from '@angular/service-worker';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

    constructor(private swUpdate: SwUpdate) {}

    ngOnInit(): void {
        if (this.swUpdate.isEnabled) {
            this.swUpdate.available.subscribe(() => {
                if (confirm('New version available. Load New Version?')) {
                    window.location.reload();
                }
            });
        }
    }
}
