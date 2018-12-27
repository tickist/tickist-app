import {browser} from 'protractor';
import fs = require('fs');


export class TickistStorage {

    static clearStorage() {
        browser.executeScript(() => {
            window.localStorage.clear();
        });
    }

    static setDummyUserData(userId = 1) {
        browser.executeScript(() => {

            window.localStorage.setItem('JWT', 'access token');
            window.localStorage.setItem('JWT_REFRESH', 'refresh token');
            window.localStorage.setItem('USER_ID', '1');
        });
    }
}




// abstract writing screen shot to a file
export function writeScreenShot(data, filename) {
    const stream = fs.createWriteStream(`screenshots/${filename}`);
    stream.write(new Buffer(data, 'base64'));
    stream.end();
}
