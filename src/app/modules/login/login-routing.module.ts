import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {LoginComponent} from './pages/login';


const routes: Routes = [
    {
        path: '',
        component: LoginComponent,
        outlet: 'content'
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class TickistLoginRoutingModule {
}
