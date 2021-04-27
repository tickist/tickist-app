import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {BlankComponent} from '../../shared/components/blank/blank.component';
import {ArchiveComponent} from "./components/archive/archive.component";


// Blank component is here because angular has a bug: https://github.com/angular/angular/issues/20694#issuecomment-595707956
const routes: Routes = [
    {
        path: ':projectId',
        children: [
            {
                path: '',
                outlet: 'content',
                component: ArchiveComponent
            },
            {
                path: '',
                component: BlankComponent
            }
        ],
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class TickistArchiveRoutingModule {
}
