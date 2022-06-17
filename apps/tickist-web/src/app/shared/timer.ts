import { NGXLogger } from "ngx-logger";

export class Timer {
    readonly start = performance.now();

    constructor(private readonly name: string, private logger: NGXLogger) {}

    stop() {
        const time = performance.now() - this.start;
        this.logger.info(
            "Timer:",
            this.name,
            "finished in",
            Math.round(time),
            "ms"
        );
    }
}
