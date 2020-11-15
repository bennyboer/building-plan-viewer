import {ChangeDetectionStrategy, Component, Inject, OnInit, ViewChild} from "@angular/core";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {FileUtil} from "../../../util/file-util";
import {MatVerticalStepper} from "@angular/material/stepper";
import {CanvasSourceReader} from "../../canvas/source/canvas-source-reader";
import {CanvasSourceReaders} from "../../canvas/source/canvas-source-readers";
import {MatSnackBar} from "@angular/material/snack-bar";
import {CanvasSource} from "../../canvas/source/canvas-source";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {UploadDialogResult} from "./upload-dialog-result";
import {UploadDialogData} from "./upload-dialog-data";

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

	constructor(
		private readonly formBuilder: FormBuilder,
		private readonly snackBar: MatSnackBar,
		private readonly dialogRef: MatDialogRef<UploadDialogComponent>,
		@Inject(MAT_DIALOG_DATA) private readonly data: UploadDialogData
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
			secondCtrl: ["", Validators.required]
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
	 * Called when the upload should start.
	 */
	public async onUpload(): Promise<void> {
		if (!!this.selectedFile) {
			const fileEnding: string = FileUtil.getFileEnding(this.selectedFile);
			if (!CanvasSourceReaders.getSupportedFileEndings().has(fileEnding)) {
				const supportedFileEndings = Array.from(CanvasSourceReaders.getSupportedFileEndings());
				supportedFileEndings.sort();

				this.snackBar.open(`The viewer currently supports only CAD files with the following file endings: ${supportedFileEndings.map(e => `*.${e}`).join(", ")}`);
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
	 * Called on dialog finishing.
	 */
	public async onFinish(): Promise<void> {
		this.dialogRef.close({
			canvasSource: this.canvasSource
		} as UploadDialogResult);
	}

}
