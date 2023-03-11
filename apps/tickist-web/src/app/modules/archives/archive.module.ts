import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ArchiveComponent } from "./components/archive/archive.component";
import { TickistArchiveRoutingModule } from "./archive-routing.module";
import { TickistMaterialModule } from "../../material.module";
import { StoreModule } from "@ngrx/store";
import * as fromArchive from "./reducers/archive.reducers";
import { EffectsModule } from "@ngrx/effects";
import { ArchiveEffects } from "./effects/archive.effects";
import { ProjectHeaderComponent } from "./components/project-header/project-header.component";
import { TickistSingleTaskModule } from "../../single-task/single-task.module";
import { TickistSharedModule } from "../../shared/shared.module";
import { FlexModule } from "@ngbracket/ngx-layout";
import { NoArchivedTasksComponent } from "./components/no-archived-tasks/no-archived-tasks.component";

@NgModule({
    declarations: [ArchiveComponent, ProjectHeaderComponent, NoArchivedTasksComponent],
    imports: [
        TickistMaterialModule,
        CommonModule,
        TickistArchiveRoutingModule,
        StoreModule.forFeature("archive", fromArchive.reducer),
        EffectsModule.forFeature([ArchiveEffects]),
        TickistSingleTaskModule,
        TickistSharedModule,
        FlexModule,
    ],
    exports: [ArchiveComponent],
})
export class ArchiveModule {}
