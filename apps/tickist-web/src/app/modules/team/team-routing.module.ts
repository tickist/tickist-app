import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { TeamComponent } from "./components/team/team.component";

const routes: Routes = [
    {
        path: "",
        children: [
            {
                path: "",
                outlet: "content",
                component: TeamComponent,
            },
        ],
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class TickistTeamRoutingModule {}
