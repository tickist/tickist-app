import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {SignUpComponent} from './pages/sign-up/sign-up.component';


const routes: Routes = [
    {
        path: '',
        component: SignUpComponent,
        outlet: 'content'
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class TickistSignUpRoutingModule {
}
