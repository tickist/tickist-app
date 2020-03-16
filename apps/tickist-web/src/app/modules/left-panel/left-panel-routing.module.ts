import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {LeftPanelComponent} from './pages/left-panel/left-panel.component';



const routes: Routes = [
    {
        path: '',
        component: LeftPanelComponent,
        // children: [
        //     {
        //         path: '',
        //         // outlet: 'left',
        //         component: LeftPanelComponent,
        //     }
        // ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class TickistLeftPanelRoutingModule {}
