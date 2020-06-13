import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {UserComponent} from './components/user/user.component';
import {BlankComponent} from "../../shared/components/blank/blank.component";


const routes: Routes = [
    {
        path: '',
        children: [
            {
                path: '',
                outlet: 'content',
                component: UserComponent
            },
            {
                path: '',
                component: BlankComponent
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class TickistEditUserSettingsRoutingModule {}
