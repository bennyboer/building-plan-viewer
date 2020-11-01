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

const materialModules = [
	MatButtonModule,
	MatIconModule,
	MatTooltipModule,
	MatSnackBarModule
];

@NgModule({
	declarations: [
		AppComponent,
		ViewerComponent,
		ControlsComponent,
		CanvasComponent
	],
	imports: [
		BrowserModule,
		AppRoutingModule,
		BrowserAnimationsModule,
		...materialModules
	],
	providers: [],
	bootstrap: [AppComponent]
})
export class AppModule {
}
