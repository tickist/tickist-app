import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ForgotPasswordComponent} from './pages/forgot-password';


const routes: Routes = [
    {
        path: '',
        component: ForgotPasswordComponent,
        outlet: 'content'
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class TickistForgotPasswordRoutingModule {
}
