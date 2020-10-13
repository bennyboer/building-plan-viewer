import {ChangeDetectionStrategy, Component} from "@angular/core";

/**
 * Main component of the application.
 */
@Component({
	selector: "app-root",
	templateUrl: "./app.component.html",
	styleUrls: ["./app.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {

	/**
	 * Title of the application.
	 */
	private static readonly TITLE: string = "Building plan viewer";

}
