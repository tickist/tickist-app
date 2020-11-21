import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleConnectComponent } from './components/google-connect/google-connect.component';
import { FacebookConnectComponent } from './components/facebook-connect/facebook-connect.component';
import {PromptUserForPasswordDialogComponent} from './components/prompt-user-for-password-dialog/prompt-user-for-password-dialog.component';
import {IconsModule} from '../../icons.module';
import {TickistMaterialModule} from '../../material.module';
import {ReactiveFormsModule} from '@angular/forms';

@NgModule({
    declarations: [GoogleConnectComponent, FacebookConnectComponent, PromptUserForPasswordDialogComponent, ],
    exports: [
        FacebookConnectComponent,
        GoogleConnectComponent
    ],
    imports: [
        CommonModule,
        IconsModule,
        TickistMaterialModule,
        ReactiveFormsModule
    ]
})
export class AuthModule { }
