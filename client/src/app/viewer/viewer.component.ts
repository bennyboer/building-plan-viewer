import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
	NgZone,
	OnDestroy,
	OnInit,
	ViewChild
} from "@angular/core";
import {ControlsComponent} from "./controls/controls.component";
import {Subscription} from "rxjs";
import {MatSnackBar} from "@angular/material/snack-bar";
import {LoadingDialogService} from "./dialog/loading/service/loading-dialog.service";
import {CanvasComponent, LoadEvent} from "./canvas/canvas.component";
import {MatDialog, MatDialogRef} from "@angular/material/dialog";
import {CADFileReference} from "../service/cad/cad-file-reference";
import {CADFileService} from "../service/cad/cad-file.service";
import {CADFile} from "../service/cad/cad-file";
import {CanvasSourceReaders} from "./canvas/source/canvas-source-readers";
import {CanvasSourceReader} from "./canvas/source/canvas-source-reader";
import {OpenDialogComponent} from "./dialog/cad/open/open-dialog.component";
import {UploadDialogComponent} from "./dialog/cad/upload/upload-dialog.component";
import {UploadDialogData} from "./dialog/cad/upload/upload-dialog-data";
import {SelectRoomMappingDialogComponent} from "./dialog/room-mapping/select/select-room-mapping-dialog.component";
import {SelectRoomMappingDialogData} from "./dialog/room-mapping/select/select-room-mapping-dialog-data";
import {SelectRoomMappingDialogResult} from "./dialog/room-mapping/select/select-room-mapping-dialog-result";
import {RoomMappingService} from "../service/room-mapping/room-mapping.service";
import {RoomMappingCollection} from "../service/room-mapping/room-mapping-collection";

/**
 * Viewer component displaying the building plan, etc.
 */
@Component({
	selector: "app-viewer-component",
	templateUrl: "viewer.component.html",
	styleUrls: ["viewer.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewerComponent implements OnInit, OnDestroy {

	/**
	 * Message shown as placeholder when no file has been loaded.
	 */
	private static readonly PLACEHOLDER_MESSAGE = "Please upload a CAD file to view";

	/**
	 * Message shown when a file is dragged over the viewer component.
	 */
	private static readonly RELEASE_MOUSE_TO_DROP_MESSAGE = "Release the mouse to load the file";

	/**
	 * Controls of the viewer.
	 */
	@ViewChild(ControlsComponent, {static: true})
	public controls: ControlsComponent;

	/**
	 * Subscription to controls load events.
	 */
	private uploadSubscription: Subscription;

	/**
	 * Subscription to controls open events.
	 */
	private openSubscription: Subscription;

	/**
	 * Subscription to controls export events.
	 */
	private exportSubscription: Subscription;

	/**
	 * Subscription to viewport reset events.
	 */
	private viewportResetSubscription: Subscription;

	/**
	 * Subscription to manage room mapping events.
	 */
	private manageRoomMappingsSubscription: Subscription;

	/**
	 * Whether the placeholder should be shown.
	 */
	public showPlaceholder: boolean = true;

	/**
	 * Currently shown placeholder message.
	 */
	public placeHolderMessage: string = ViewerComponent.PLACEHOLDER_MESSAGE;

	/**
	 * Subscription to load events from the canvas component.
	 */
	private loadEventSub: Subscription;

	/**
	 * Subscription to loading dialog cancel events.
	 */
	private loadingDialogCancelSub: Subscription;

	/**
	 * Whether cancelling the loading is currently requested.
	 */
	private cancelRequested: boolean = false;

	/**
	 * Reference of the currently shown CAD file.
	 */
	private currentCadFileReference: CADFileReference | null = null;

	/**
	 * Canvas component of the viewer.
	 */
	@ViewChild(CanvasComponent)
	public canvasComponent: CanvasComponent;

	constructor(
		private readonly cd: ChangeDetectorRef,
		private readonly element: ElementRef,
		private readonly zone: NgZone,
		private readonly snackBar: MatSnackBar,
		private readonly loadingDialogService: LoadingDialogService,
		private readonly dialog: MatDialog,
		private readonly cadFileService: CADFileService,
		private readonly roomMappingService: RoomMappingService
	) {
	}

	/**
	 * Called on component destruction.
	 */
	public ngOnDestroy(): void {
		if (!!this.loadEventSub) {
			this.loadEventSub.unsubscribe();
		}
		if (!!this.loadingDialogCancelSub) {
			this.loadingDialogCancelSub.unsubscribe();
		}

		this.cleanupControlBindings();
	}

	/**
	 * Initialize bindings to the controls component.
	 */
	private initializeControlBindings() {
		this.openSubscription = this.controls.onOpen.subscribe(() => this.onOpen());
		this.uploadSubscription = this.controls.onUpload.subscribe(() => this.onUpload());
		this.viewportResetSubscription = this.controls.onViewportReset.subscribe(() => this.onResetViewport());
		this.manageRoomMappingsSubscription = this.controls.onManageRoomMappings.subscribe(() => this.onManageRoomMappings());
	}

	/**
	 * Cleanup bindings to the controls component.
	 */
	private cleanupControlBindings() {
		this.openSubscription.unsubscribe();
		this.uploadSubscription.unsubscribe();
		this.exportSubscription.unsubscribe();
		this.viewportResetSubscription.unsubscribe();
		this.manageRoomMappingsSubscription.unsubscribe();
	}

	/**
	 * Open a CAD file by the passed reference.
	 * @param reference
	 */
	public async openCADFileByReference(reference: CADFileReference): Promise<void> {
		this.showPlaceholder = false;
		this.cd.markForCheck();

		this.currentCadFileReference = reference;

		this.loadingDialogService.open({message: "Loading file...", progress: 0});

		if (!this.loadEventSub) {
			this.loadEventSub = this.canvasComponent.loadEvents.subscribe((event) => this.onCanvasLoading(event));
		}

		const cadFile: CADFile = await this.cadFileService.getOne(reference.id);

		const reader: CanvasSourceReader = CanvasSourceReaders.getReader(cadFile.type);
		if (!reader) {
			throw new Error(`CAD file type '${cadFile.type}' is unsupported`);
		}

		this.canvasComponent.source = await reader.read(cadFile);
		this.controls.canvasOptionsEnabled = true;
	}

	/**
	 * Called when a open event arrives from the controls component.
	 */
	public async onOpen(): Promise<void> {
		const result: CADFileReference | null = await this.openFile();

		if (!!result) {
			await this.openCADFileByReference(result);
		}
	}

	/**
	 * Called when a load event arrives from the controls component.
	 */
	public async onUpload(): Promise<void> {
		const reference: CADFileReference | null = await this.uploadFile();
		if (!!reference) {
			this.openCADFileByReference(reference);
		}
	}

	/**
	 * Let the user open an already existing CAD file.
	 */
	public async openFile(): Promise<CADFileReference | null> {
		const dialogRef: MatDialogRef<OpenDialogComponent> = this.dialog.open(OpenDialogComponent, {
			hasBackdrop: true
		});

		return await dialogRef.afterClosed().toPromise();
	}

	/**
	 * Let the user upload a file.
	 * @param file to prefill upload dialog with
	 */
	public async uploadFile(file?: File): Promise<CADFileReference | null> {
		const dialogRef: MatDialogRef<UploadDialogComponent> = this.dialog.open(UploadDialogComponent, {
			hasBackdrop: true,
			disableClose: true,
			data: {
				file
			} as UploadDialogData
		});

		return await dialogRef.afterClosed().toPromise();
	}

	/**
	 * Called when the viewport reset event arrives from the controls component.
	 */
	public async onResetViewport(): Promise<void> {
		this.canvasComponent.resetViewport();
	}

	/**
	 * Called when the room mappings should be managed.
	 */
	public async onManageRoomMappings(): Promise<void> {
		const dialogRef: MatDialogRef<SelectRoomMappingDialogComponent> = this.dialog.open(SelectRoomMappingDialogComponent, {
			hasBackdrop: true,
			data: {
				cadFileID: this.currentCadFileReference.id
			} as SelectRoomMappingDialogData
		});

		const result: SelectRoomMappingDialogResult = await dialogRef.afterClosed().toPromise();

		if (!!result) {
			if (!!result.reference) {
				const mapping: RoomMappingCollection = await this.roomMappingService.getOne(result.reference.id);

				this.canvasComponent.setRoomMappings(mapping.mappings);
			} else {
				this.canvasComponent.setRoomMappings(null);
			}
		}
	}

	/**
	 * Called when the canvas loading has finished or started (Rendering of the CAD file).
	 * @param event that occurred
	 */
	public onCanvasLoading(event: LoadEvent): void {
		if (event.isLoading) {
			this.loadingDialogService.open({
				message: "Drawing...",
				progress: event.progress,
				cancelAllowed: true
			}).then(() => {
				if (!this.loadingDialogCancelSub) {
					this.cancelRequested = false;
					this.loadingDialogCancelSub = this.loadingDialogService.cancelEvents().subscribe(() => {
						this.cancelRequested = true;
					});
				}

				if (this.cancelRequested) {
					event.cancelLoading();
				} else {
					event.continueLoading();
				}
			});
		} else {
			this.loadingDialogService.close();

			if (!!this.loadingDialogCancelSub) {
				this.loadingDialogCancelSub.unsubscribe();
				this.loadingDialogCancelSub = null;
			}
		}
	}

	/**
	 * Called on component initialization.
	 */
	public ngOnInit(): void {
		this.initializeControlBindings();
	}

	/**
	 * Called on drop on the component.
	 * @param event of the drop
	 */
	@HostListener("drop", ["$event"])
	public onDrop(event: DragEvent): void {
		event.preventDefault(); // Prevent the default action (opening link or something)

		if (!!event.dataTransfer && !!event.dataTransfer.files && event.dataTransfer.files.length >= 1) {
			const file: File = event.dataTransfer.files[0];

			this.uploadFile(file).then((result) => {
				if (!!result) {
					this.openCADFileByReference(result);
				}
			});
		}
	}

	/**
	 * Called on drag over the component.
	 * @param event of the drag over
	 */
	@HostListener("dragover", ["$event"])
	public onDragOver(event: DragEvent): void {
		event.preventDefault(); // Allow dropping files
	}

	/**
	 * Called on drag enter on the component.
	 * @param event of the drag enter
	 */
	@HostListener("dragenter", ["$event"])
	public onDragEnter(event: DragEvent): void {
		if (!!event.target && event.target instanceof HTMLElement) {
			const target: HTMLElement = event.target;
			if (target.className === "placeholder") {
				// Set "you are allowed to drop" message
				this.placeHolderMessage = ViewerComponent.RELEASE_MOUSE_TO_DROP_MESSAGE;
			}
		}
	}

	/**
	 * Called on drag leave on the component.
	 * @param event of the drag leave
	 */
	@HostListener("dragleave", ["$event"])
	public onDragLeave(event: DragEvent): void {
		if (!!event.target && event.target instanceof HTMLElement) {
			const target: HTMLElement = event.target;
			if (target.className === "placeholder") {
				// Reset drop message
				this.placeHolderMessage = ViewerComponent.PLACEHOLDER_MESSAGE;
			}
		}
	}

}
