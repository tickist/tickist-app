import {NgModule} from '@angular/core';
import {UserComponent} from './user/user.component';
import {TeamComponent} from './team/team.component';
import {TickistMaterialModule} from '../material.module';
import {FlexLayoutModule} from '@angular/flex-layout';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {CalendarModule} from 'primeng/components/calendar/calendar';
import {TickistSharedModule} from '../shared/shared.module';
import {EffectsModule} from '@ngrx/effects';
import {UserEffects} from './user.effects';
import {StoreModule} from '@ngrx/store';
import * as fromUser from './user.reducer';
import * as fromTeam from './team.reducer';
import { TeamEffects } from './team.effects';


@NgModule({
    imports: [
        CommonModule,
        TickistMaterialModule,
        FlexLayoutModule,
        ReactiveFormsModule,
        TickistSharedModule,
        FormsModule,
        CalendarModule,
        EffectsModule.forFeature([UserEffects, TeamEffects]),
        StoreModule.forFeature('user', fromUser.reducer),
        StoreModule.forFeature('team', fromTeam.reducer)
    ],
    providers: [],
    exports: [],
    declarations: [
        UserComponent, TeamComponent
    ]
})
export class TickistUserModule {
}
