export class Ping {
    img: any;
    opt: any;
    favicon: string;
    timeout: any;

    constructor(opt = {}) {
        this.opt = opt || {};
        this.favicon = this.opt.favicon || '/favicon.png';
        this.timeout = this.opt.timeout || 0;
    }

    ping(source, callback) {
        this.img = new Image();
        let timer;

        const start: number = new Date().getTime();
        this.img.onload = pingCheck;
        this.img.onerror = pingCheck;
        if (this.timeout) {
            timer = setTimeout(pingCheck, this.timeout);
        }

        /**
         * Times ping and triggers callback.
         */
        function pingCheck(e) {
            if (timer) {
                clearTimeout(timer);
            }
            let pong: number;
            pong = new Date().getTime() - start;

            if (typeof callback === 'function') {
                if (e.type === 'error') {
                    console.error('error loading resource');
                    return callback('error', pong);
                }
                return callback(null, pong);
            }
        }

        this.img.src = source + this.favicon + '?' + (+new Date()); // Trigger image load with cache buster
    }
}
