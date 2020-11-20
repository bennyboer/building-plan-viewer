import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from "@angular/material/dialog";
import {CADFileReference} from "../../../../service/cad/cad-file-reference";
import {RoomMappingService} from "../../../../service/room-mapping/room-mapping.service";
import {SelectRoomMappingDialogData} from "./select-room-mapping-dialog-data";
import {RoomMappingReference} from "../../../../service/room-mapping/room-mapping-reference";
import {SelectRoomMappingDialogResult} from "./select-room-mapping-dialog-result";
import {RoomMappingUploadDialogComponent} from "../upload/room-mapping-upload-dialog.component";
import {RoomMappingUploadDialogData} from "../upload/room-mapping-upload-dialog-data";

/**
 * Component letting the user select a room mapping to display.
 */
@Component({
	selector: "app-select-room-mapping-dialog-component",
	templateUrl: "select-room-mapping-dialog.component.html",
	styleUrls: ["select-room-mapping-dialog.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectRoomMappingDialogComponent implements OnInit {

	/**
	 * Promise for loading CAD file references.
	 */
	public referencePromise: Promise<CADFileReference[]>;

	// TODO Let the user delete mappings and CAD files!

	constructor(
		private readonly cd: ChangeDetectorRef,
		private readonly dialogRef: MatDialogRef<SelectRoomMappingDialogComponent>,
		private readonly roomMappingService: RoomMappingService,
		private readonly dialog: MatDialog,
		@Inject(MAT_DIALOG_DATA) private readonly data: SelectRoomMappingDialogData,
	) {
	}

	/**
	 * Called on component initialization.
	 */
	public ngOnInit(): void {
		this.refresh();
	}

	/**
	 * Refresh the displayed mappings.
	 */
	private refresh(): void {
		this.referencePromise = this.roomMappingService.getAllForCADFileID(this.data.cadFileID);
	}

	/**
	 * On dialog cancellation.
	 */
	public onCancel(): void {
		this.dialogRef.close();
	}

	/**
	 * Called when a mapping has been selected.
	 * @param reference that has been selected
	 */
	public onSelect(reference: RoomMappingReference | null): void {
		this.dialogRef.close({
			reference
		} as SelectRoomMappingDialogResult);
	}

	/**
	 * Called when a new mapping should be created.
	 */
	public onCreateMapping(): void {
		this.dialog.open(RoomMappingUploadDialogComponent, {
			hasBackdrop: true,
			data: {
				cadFileID: this.data.cadFileID
			} as RoomMappingUploadDialogData
		}).afterClosed().subscribe(() => {
			this.refresh();
			this.cd.markForCheck();
		});
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
