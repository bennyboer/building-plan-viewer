import {BrowserModule} from "@angular/platform-browser";
import {NgModule} from "@angular/core";

import {AppRoutingModule} from "./app-routing.module";
import {AppComponent} from "./app.component";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {MatButtonModule} from "@angular/material/button";
import {ViewerComponent} from "./viewer/viewer.component";
import {ControlsComponent} from "./viewer/controls/controls.component";
import {MatIconModule} from "@angular/material/icon";
import {MatTooltipModule} from "@angular/material/tooltip";
import {MatSnackBarModule} from "@angular/material/snack-bar";
import {CanvasComponent} from "./viewer/canvas/canvas.component";
import {MatDialogModule} from "@angular/material/dialog";
import {LoadingDialogComponent} from "./viewer/dialog/loading/component/loading-dialog.component";
import {LoadingDialogService} from "./viewer/dialog/loading/service/loading-dialog.service";
import {MatProgressBarModule} from "@angular/material/progress-bar";
import {MatSlideToggleModule} from "@angular/material/slide-toggle";
import {LocalSettingsService} from "./util/settings/local-settings.service";
import {ThemeService} from "./util/theme/theme.service";
import {UploadDialogComponent} from "./viewer/dialog/upload/upload-dialog.component";
import {MatStepperModule} from "@angular/material/stepper";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {ReactiveFormsModule} from "@angular/forms";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {NgxCsvParserModule} from "ngx-csv-parser";
import {MatExpansionModule} from "@angular/material/expansion";

const materialModules: any[] = [
	MatButtonModule,
	MatIconModule,
	MatTooltipModule,
	MatSnackBarModule,
	MatDialogModule,
	MatProgressBarModule,
	MatSlideToggleModule,
	MatStepperModule,
	MatProgressSpinnerModule,
	MatFormFieldModule,
	MatInputModule,
	MatExpansionModule
];

@NgModule({
	declarations: [
		AppComponent,
		ViewerComponent,
		ControlsComponent,
		CanvasComponent,
		LoadingDialogComponent,
		UploadDialogComponent
	],
	imports: [
		BrowserModule,
		AppRoutingModule,
		BrowserAnimationsModule,
		ReactiveFormsModule,
		...materialModules,
		NgxCsvParserModule
	],
	providers: [
		LoadingDialogService,
		LocalSettingsService,
		ThemeService
	],
	bootstrap: [AppComponent]
})
export class AppModule {
}
