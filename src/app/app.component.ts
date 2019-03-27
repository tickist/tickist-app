import { Component } from '@angular/core';
import 'hammerjs'; // Recommended
import gitInfo from '../git-version.json';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

    constructor() {
        console.log(gitInfo)
    }
}
