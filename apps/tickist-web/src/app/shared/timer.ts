export class Timer {
  readonly start = performance.now();

  constructor(private readonly name: string) {}

  stop() {
    const time = performance.now() - this.start;
    console.log('Timer:', this.name, 'finished in', Math.round(time), 'ms');
  }
}
