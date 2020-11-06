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
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {MatProgressBarModule} from "@angular/material/progress-bar";

const materialModules: any[] = [
	MatButtonModule,
	MatIconModule,
	MatTooltipModule,
	MatSnackBarModule,
	MatDialogModule,
	MatProgressBarModule
];

@NgModule({
	declarations: [
		AppComponent,
		ViewerComponent,
		ControlsComponent,
		CanvasComponent,
		LoadingDialogComponent
	],
	imports: [
		BrowserModule,
		AppRoutingModule,
		BrowserAnimationsModule,
		...materialModules
	],
	providers: [
		LoadingDialogService
	],
	bootstrap: [AppComponent]
})
export class AppModule {
}
