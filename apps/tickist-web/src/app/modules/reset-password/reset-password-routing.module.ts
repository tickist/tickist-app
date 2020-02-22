import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ResetPasswordComponent} from './pages/reset-password';
import {RequestResetPasswordComponent} from './pages/request-reset-password/request-reset-password.component';


const routes: Routes = [
    {

        path: '',
        pathMatch: 'full',
        redirectTo: '/reset-password/(content:request)'
    },
    {
        path: 'request',
        component: RequestResetPasswordComponent,
        outlet: 'content',
    },
    {
        path: 'change',
        component: ResetPasswordComponent,
        outlet: 'content',
    }
    ];



@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class TickistResetPasswordRoutingModule {
}
