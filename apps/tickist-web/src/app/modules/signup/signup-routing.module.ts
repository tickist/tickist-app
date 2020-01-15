import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {SignupComponent} from './pages/signup/signup.component';


const routes: Routes = [
    {
        path: '',
        component: SignupComponent,
        outlet: 'content'
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class TickistSignUpRoutingModule {
}
