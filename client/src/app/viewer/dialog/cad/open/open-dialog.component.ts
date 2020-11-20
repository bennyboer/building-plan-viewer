import {ChangeDetectionStrategy, Component, OnInit} from "@angular/core";
import {MatDialogRef} from "@angular/material/dialog";
import {CADFileService} from "../../../../service/cad/cad-file.service";
import {CADFileReference} from "../../../../service/cad/cad-file-reference";

/**
 * Dialog component to open an already uploaded CAD file.
 */
@Component({
	selector: "app-open-dialog-component",
	templateUrl: "open-dialog.component.html",
	styleUrls: ["open-dialog.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class OpenDialogComponent implements OnInit {

	/**
	 * Promise for loading CAD file references.
	 */
	public referencePromise: Promise<CADFileReference[]>;

	constructor(
		private readonly dialogRef: MatDialogRef<OpenDialogComponent>,
		private readonly cadFileService: CADFileService
	) {
	}

	/**
	 * Called on component initialization.
	 */
	public ngOnInit(): void {
		this.referencePromise = this.cadFileService.getAll();
	}

	/**
	 * On dialog cancellation.
	 */
	public onCancel(): void {
		this.dialogRef.close();
	}

	/**
	 * Called when the dialog open button is clicked.
	 * @param reference that has been clicked on
	 */
	public onOpen(reference: CADFileReference): void {
		this.dialogRef.close(reference);
	}

	/**
	 * Get a representation of the passed timestamp.
	 * @param timestamp to convert
	 */
	public getCreatedDateRepresentation(timestamp: string): string {
		const date: Date = new Date(timestamp);

		return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
	}

}
