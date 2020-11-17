import {ChangeDetectionStrategy, Component, Inject, OnInit, ViewChild} from "@angular/core";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {FileUtil} from "../../../util/file-util";
import {MatVerticalStepper} from "@angular/material/stepper";
import {CanvasSourceReader} from "../../canvas/source/canvas-source-reader";
import {CanvasSourceReaders} from "../../canvas/source/canvas-source-readers";
import {MatSnackBar} from "@angular/material/snack-bar";
import {CanvasSource} from "../../canvas/source/canvas-source";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {RoomMapping, UploadDialogResult, Vertex} from "./upload-dialog-result";
import {UploadDialogData} from "./upload-dialog-data";
import {NgxCsvParser, NgxCSVParserError} from "ngx-csv-parser";
import {first} from "rxjs/operators";

/**
 * Dialog component for uploading a CAD file.
 */
@Component({
	selector: "app-upload-dialog-component",
	templateUrl: "upload-dialog.component.html",
	styleUrls: ["upload-dialog.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadDialogComponent implements OnInit {

	/**
	 * Form group for uploading a file.
	 */
	public uploadFormGroup: FormGroup;

	/**
	 * Form group for defining a room mapping.
	 */
	public mappingFormGroup: FormGroup;

	/**
	 * Stepper component.
	 */
	@ViewChild(MatVerticalStepper)
	public stepper: MatVerticalStepper;

	/**
	 * Selected file to upload.
	 */
	private selectedFile: File;

	/**
	 * Read canvas source.
	 */
	private canvasSource: CanvasSource;

	/**
	 * Selected CSV file to upload.
	 */
	private selectedCSVFile: File;

	constructor(
		private readonly formBuilder: FormBuilder,
		private readonly snackBar: MatSnackBar,
		private readonly dialogRef: MatDialogRef<UploadDialogComponent>,
		@Inject(MAT_DIALOG_DATA) private readonly data: UploadDialogData,
		private readonly csvParser: NgxCsvParser
	) {
		this.selectedFile = data.file;
	}

	/**
	 * Called on component initialization.
	 */
	public ngOnInit(): void {
		this.uploadFormGroup = this.formBuilder.group({
			selectedFileCtrl: [{value: !!this.selectedFile ? this.selectedFile.name : "", disabled: true}, Validators.required]
		});
		this.mappingFormGroup = this.formBuilder.group({
			selectedFileCtrl: [{value: "", disabled: true}, Validators.required],
			delimiter: [",", Validators.required],
			roomNameHeader: ["RoomNumber", Validators.required],
			categoryHeader: ["Cluster", Validators.required],
			polygonListHeader: ["Polygon", Validators.required],
		});
	}

	/**
	 * Called when a file should be selected.
	 */
	public async onSelectFile(): Promise<void> {
		const file = (await FileUtil.openFileChooser(
			Array.from(CanvasSourceReaders.getSupportedFileEndings()).map(e => `.${e}`)
		))[0];

		this.selectedFile = file;
		this.uploadFormGroup.setValue({selectedFileCtrl: file.name});
	}

	/**
	 * Called when a csv file should be selected.
	 */
	public async onSelectCSVFile(): Promise<void> {
		const file = (await FileUtil.openFileChooser([".csv"]))[0];

		this.selectedCSVFile = file;
		this.mappingFormGroup.controls.selectedFileCtrl.setValue(file.name);
	}

	/**
	 * Called when the upload should start.
	 */
	public async onUpload(): Promise<void> {
		if (!!this.selectedFile) {
			const fileEnding: string = FileUtil.getFileEnding(this.selectedFile);
			if (!CanvasSourceReaders.getSupportedFileEndings().has(fileEnding)) {
				const supportedFileEndings = Array.from(CanvasSourceReaders.getSupportedFileEndings());
				supportedFileEndings.sort();

				this.snackBar.open(
					`The viewer currently supports only CAD files with the following file endings: ${supportedFileEndings.map(e => `*.${e}`).join(", ")}`,
					"OK",
					{
						duration: 5000,
					}
				);
				return;
			}

			this.stepper.next();

			const reader: CanvasSourceReader = CanvasSourceReaders.getReader(this.selectedFile);
			if (!reader) {
				throw new Error(`File with extension '${FileUtil.getFileEnding(this.selectedFile)}' is unsupported`);
			}

			this.canvasSource = await reader.read(this.selectedFile);

			this.stepper.next();
		}
	}

	/**
	 * On dialog cancellation.
	 */
	public onCancel(): void {
		this.dialogRef.close();
	}

	/**
	 * Read the mapping from the selected CSV file.
	 * @param delimiter to use for parsing
	 * @param roomNameHeader header name of the room name CSV header
	 * @param categoryHeader header name of the category CSV header
	 * @param polygonListHeader header name of the polygon list CSV header
	 */
	private async readMappingFromCSV(
		delimiter: string,
		roomNameHeader: string,
		categoryHeader: string,
		polygonListHeader: string
	): Promise<RoomMapping[]> {
		const entries: any[] | NgxCSVParserError = await this.csvParser
			.parse(this.selectedCSVFile, {delimiter, header: true})
			.pipe(first())
			.toPromise();

		if (entries instanceof NgxCSVParserError) {
			throw new Error("Could not parse the provided CSV");
		} else {
			// Map entries to room mapping entries.
			const result: RoomMapping[] = [];
			for (const entry of entries) {
				// Parse polygon list
				const vertices: Vertex[] = [];
				let polygonStr: string = entry[polygonListHeader];
				polygonStr = polygonStr.substring(1, polygonStr.length - 1);
				const parts: string[] = polygonStr.split(",");

				for (let i = 0; i < parts.length; i += 2) {
					const first: string = parts[i].trim().substring(1);
					const second: string = parts[i + 1].substring(0, parts[i + 1].length - 1).trim();

					vertices.push({
						x: parseFloat(first),
						y: parseFloat(second)
					} as Vertex);
				}

				result.push({
					roomName: entry[roomNameHeader],
					category: entry[categoryHeader],
					vertices
				} as RoomMapping);
			}

			return result;
		}
	}

	/**
	 * Called on dialog finishing.
	 */
	public async onFinish(): Promise<void> {
		if (!this.mappingFormGroup.valid) {
			return;
		}

		let roomMappings: RoomMapping[];
		if (!!this.selectedCSVFile) {
			roomMappings = await this.readMappingFromCSV(
				this.mappingFormGroup.controls.delimiter.value,
				this.mappingFormGroup.controls.roomNameHeader.value,
				this.mappingFormGroup.controls.categoryHeader.value,
				this.mappingFormGroup.controls.polygonListHeader.value
			);
		}

		this.dialogRef.close({
			canvasSource: this.canvasSource,
			roomMappings
		} as UploadDialogResult);
	}

}
