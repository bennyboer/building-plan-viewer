import {Injectable, OnDestroy} from "@angular/core";
import {MatDialog, MatDialogRef} from "@angular/material/dialog";
import {LoadingDialogComponent} from "../component/loading-dialog.component";
import {LoadingDialogConfig} from "../config/loading-dialog-config";

/**
 * Service for displaying loading dialogs.
 */
@Injectable({
	providedIn: "root"
})
export class LoadingDialogService implements OnDestroy {

	/**
	 * Current dialog reference.
	 */
	private dialogRef: MatDialogRef<LoadingDialogComponent> | null = null;

	/**
	 * How many times the open method has been called without a matching
	 * close call.
	 */
	private openCounter: number = 0;

	constructor(
		private readonly dialog: MatDialog
	) {
	}

	/**
	 * Open a loading dialog using the passed configuration.
	 * If there is already an open dialog, it will be updated with the new configuration.
	 * @param config to open/update dialog with
	 */
	public open(config: LoadingDialogConfig): void {
		this.openCounter++;

		if (this.dialogRef === null) {
			this.dialogRef = this.dialog.open(LoadingDialogComponent, {
				data: config,
				hasBackdrop: true,
				disableClose: true
			});
		} else {
			this.dialogRef.componentInstance.update(config);
		}
	}

	/**
	 * Close the loading dialog.
	 * If you have called the open method n times, you need to call
	 * this method n times as well in order to close the dialog entirely.
	 */
	public close(): void {
		this.openCounter--;

		if (this.openCounter < 0) {
			throw new Error("The loading dialog open counter is negative which must not happen");
		}

		if (this.openCounter === 0) {
			this.dialogRef.close(); // Close dialog
			this.dialogRef = null;
		}
	}

	/**
	 * Called on service destruction.
	 */
	public ngOnDestroy(): void {
		if (this.dialogRef !== null) {
			this.dialogRef.close();
		}
	}

}
