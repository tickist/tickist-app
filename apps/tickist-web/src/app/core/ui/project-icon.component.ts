import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import {
  projectIconLabel,
  resolveProjectIconData,
} from '../icons/project-icons';

@Component({
  selector: 'app-project-icon',
  imports: [LucideAngularModule],
  templateUrl: './project-icon.component.html',
  styleUrl: './project-icon.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectIconComponent {
  @Input() icon: string | null | undefined;
  @Input() color: string | null | undefined;
  @Input() size = 16;
  @Input() strokeWidth = 2;
  @Input() className = '';
  @Input() decorative = true;

  get iconData() {
    return resolveProjectIconData(this.icon);
  }

  get ariaLabel(): string | null {
    if (this.decorative) {
      return null;
    }
    return projectIconLabel(this.icon);
  }
}
