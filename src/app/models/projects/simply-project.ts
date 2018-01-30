import {Api} from '../commons';


export class SimpleProject extends Api {
  id: number;
  name: string;
  color: string;

  constructor(project) {
    super();
    this.id = project.id;
    this.name = project.name;
    this.color = project.color;
  }
}
