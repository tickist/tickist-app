import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TickistMaterialModule} from '../../material.module';
import {DashboardComponent} from './pages/dashboard/dashboard.component';
import {TodayComponent} from './components/today/today.component';
import {OverdueComponent} from './components/overdue/overdue.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TickistSharedModule} from '../../shared/shared.module';
import {FlexLayoutModule} from '@angular/flex-layout';
import {TickistTasksModule} from '../../tasks/tasks.module';
import {TickistDashboardRoutingModule} from './dashboard-routing.module';

@NgModule({
    imports: [CommonModule, TickistMaterialModule, FormsModule, FlexLayoutModule, TickistDashboardRoutingModule,
        ReactiveFormsModule, TickistSharedModule,  TickistTasksModule],
    providers: [],
    exports: [DashboardComponent],
    declarations: [
        DashboardComponent,
        TodayComponent,
        OverdueComponent
    ]
})
export class TickistDashboardModule {
}
