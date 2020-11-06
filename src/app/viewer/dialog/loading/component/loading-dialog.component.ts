import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject} from "@angular/core";
import {LoadingDialogConfig} from "../config/loading-dialog-config";
import {MAT_DIALOG_DATA} from "@angular/material/dialog";

/**
 * Loading dialog component.
 */
@Component({
	selector: "app-loading-dialog-component",
	templateUrl: "loading-dialog.component.html",
	styleUrls: ["loading-dialog.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingDialogComponent {

	constructor(
		private readonly cd: ChangeDetectorRef,
		@Inject(MAT_DIALOG_DATA) private config: LoadingDialogConfig
	) {
	}

	/**
	 * Update the dialog configuration.
	 */
	public update(config: LoadingDialogConfig): void {
		this.config = config;
		this.cd.markForCheck();
	}

	/**
	 * Check whether the progress indicator should be determinate.
	 */
	public get isDeterminate(): boolean {
		return this.config.progress !== null && this.config.progress !== undefined;
	}

	/**
	 * Get the progress in range 0 to 100.
	 */
	public get progress(): number {
		return this.config.progress;
	}

	/**
	 * Get the message to display.
	 */
	public get message(): string {
		return this.config.message;
	}

}
