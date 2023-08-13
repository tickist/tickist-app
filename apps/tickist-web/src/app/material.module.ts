import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatButtonModule } from "@angular/material/button";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatCardModule } from "@angular/material/card";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatChipsModule } from "@angular/material/chips";
import { DateAdapter, MatNativeDateModule, MAT_DATE_LOCALE } from "@angular/material/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatDialogModule } from "@angular/material/dialog";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatListModule } from "@angular/material/list";
import { MatMenuModule } from "@angular/material/menu";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatRadioModule } from "@angular/material/radio";
import { MatSelectModule } from "@angular/material/select";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatTreeModule } from "@angular/material/tree";
import { MatTabsModule } from "@angular/material/tabs";
import { Platform, PlatformModule } from "@angular/cdk/platform";
import { NgModule } from "@angular/core";
import { MyDateAdapter } from "./shared/data-adapter";
import { ScrollingModule } from "@angular/cdk/scrolling";
import { MatBadgeModule } from "@angular/material/badge";

@NgModule({
    imports: [
        MatButtonModule,
        MatCheckboxModule,
        MatAutocompleteModule,
        MatInputModule,
        MatRadioModule,
        MatSelectModule,
        MatSlideToggleModule,
        MatMenuModule,
        MatSidenavModule,
        MatToolbarModule,
        MatListModule,
        MatCardModule,
        MatButtonToggleModule,
        MatChipsModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatProgressBarModule,
        MatDialogModule,
        MatTooltipModule,
        MatSnackBarModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatExpansionModule,
        PlatformModule,
        MatTabsModule,
        ScrollingModule,
        MatInputModule,
        MatTreeModule,
        MatBadgeModule,
    ],
    providers: [{ provide: DateAdapter, useClass: MyDateAdapter, deps: [MAT_DATE_LOCALE, Platform] }],
    exports: [
        MatButtonModule,
        MatCheckboxModule,
        MatAutocompleteModule,
        MatInputModule,
        MatRadioModule,
        MatSelectModule,
        MatSlideToggleModule,
        MatMenuModule,
        MatSidenavModule,
        MatToolbarModule,
        MatListModule,
        MatCardModule,
        MatButtonToggleModule,
        MatChipsModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatProgressBarModule,
        MatDialogModule,
        MatTooltipModule,
        MatSnackBarModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatExpansionModule,
        PlatformModule,
        MatTabsModule,
        ScrollingModule,
        MatInputModule,
        MatTreeModule,
        MatBadgeModule,
    ],
    declarations: [],
})
export class TickistMaterialModule {}
