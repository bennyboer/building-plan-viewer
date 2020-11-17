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
import {UploadDialogComponent} from "./dialog/upload/upload-dialog.component";
import {UploadDialogResult} from "./dialog/upload/upload-dialog-result";
import {UploadDialogData} from "./dialog/upload/upload-dialog-data";

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
	private loadSubscription: Subscription;

	/**
	 * Subscription to controls export events.
	 */
	private exportSubscription: Subscription;

	/**
	 * Subscription to viewport reset events.
	 */
	private viewportResetSubscription: Subscription;

	/**
	 * Whether the placeholder should be shown.
	 */
	public showPlaceholder: boolean = true;

	/**
	 * Currently shown placeholder message.
	 */
	public placeHolderMessage: string = ViewerComponent.PLACEHOLDER_MESSAGE;

	/**
	 * The last upload dialog result.
	 */
	public lastUploadResult: UploadDialogResult;

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
		private readonly dialog: MatDialog
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
		this.loadSubscription = this.controls.onLoad.subscribe(() => this.onLoad());
		this.viewportResetSubscription = this.controls.onViewportReset.subscribe(() => this.onResetViewport());
	}

	/**
	 * Cleanup bindings to the controls component.
	 */
	private cleanupControlBindings() {
		this.loadSubscription.unsubscribe();
		this.exportSubscription.unsubscribe();
		this.viewportResetSubscription.unsubscribe();
	}

	/**
	 * Called when a load event arrives from the controls component.
	 */
	public async onLoad(): Promise<void> {
		const result: UploadDialogResult = await this.uploadFile();

		this.showUploadDialogResult(result);
	}

	/**
	 * Let the user upload a file.
	 * @param file to prefill upload dialog with
	 */
	public async uploadFile(file?: File): Promise<UploadDialogResult> {
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
	 * Show the passed upload dialog result.
	 * @param uploadResult to initialize
	 */
	private async showUploadDialogResult(uploadResult: UploadDialogResult): Promise<void> {
		if (!uploadResult) {
			return;
		}

		this.showPlaceholder = false;
		this.cd.markForCheck();

		this.loadingDialogService.open({message: "Loading file...", progress: 0});

		if (!this.loadEventSub) {
			this.loadEventSub = this.canvasComponent.loadEvents.subscribe((event) => this.onCanvasLoading(event));
		}

		this.lastUploadResult = uploadResult;

		if (!!uploadResult.roomMappings) {
			this.canvasComponent.setRoomMappings(uploadResult.roomMappings);
		} else {
			this.canvasComponent.setRoomMappings(null);
		}

		this.canvasComponent.source = uploadResult.canvasSource;
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

			this.uploadFile(file).then(result => this.showUploadDialogResult(result));
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
