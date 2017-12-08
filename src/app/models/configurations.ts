export class SideNavVisibility {
  open: boolean;
  mode: string;
  position: boolean;

  constructor(sidenav) {
    this.open = sidenav.open;
    this.mode = sidenav.mode;
    this.position = sidenav.position;
  }
}
