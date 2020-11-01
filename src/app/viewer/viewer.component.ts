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
import {BoxGeometry, Camera, Geometry, Material, Mesh, MeshBasicMaterial, PerspectiveCamera, Scene, WebGLRenderer} from "three";
import {Helper} from "dxf";
import {ControlsComponent} from "./controls/controls.component";
import {Subscription} from "rxjs";
import {FileUtil} from "../util/file-util";
import {MatSnackBar} from "@angular/material/snack-bar";

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
	private static readonly PLACEHOLDER_MESSAGE = "Please select a CAD file to load";

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
	 * Whether the placeholder should be shown.
	 */
	public showPlaceholder: boolean = true;

	/**
	 * Currently shown placeholder message.
	 */
	public placeHolderMessage: string = ViewerComponent.PLACEHOLDER_MESSAGE;

	constructor(
		private readonly cd: ChangeDetectorRef,
		private readonly element: ElementRef,
		private readonly zone: NgZone,
		private readonly snackBar: MatSnackBar
	) {
	}

	/**
	 * Called on component destruction.
	 */
	public ngOnDestroy(): void {
		this.cleanupControlBindings();
	}

	/**
	 * Initialize bindings to the controls component.
	 */
	private initializeControlBindings() {
		this.loadSubscription = this.controls.onLoad.subscribe(() => this.onLoad());
	}

	/**
	 * Cleanup bindings to the controls component.
	 */
	private cleanupControlBindings() {
		this.loadSubscription.unsubscribe();
		this.exportSubscription.unsubscribe();
	}

	/**
	 * Called when a load event arrives from the controls component.
	 */
	public async onLoad(): Promise<void> {
		const file: File = await ViewerComponent.openFileChooser();
		if (file.name.endsWith(".dxf")) {
			await this.showCADFile(file);
		} else {
			this.snackBar.open(`The viewer currently supports only DXF CAD files with the file ending '*.dxf'`);
		}
	}

	/**
	 * Open the file chooser dialog and return the chosen file.
	 */
	private static async openFileChooser(): Promise<File> {
		return (await FileUtil.openFileChooser())[0];
	}

	/**
	 * Show the passed CAD file
	 * @param file to initialize
	 */
	private async showCADFile(file: File): Promise<void> {
		this.showPlaceholder = false;
		this.cd.markForCheck();

		const contents: string | ArrayBuffer = await FileUtil.readFile(file);

		const helper: Helper = new Helper(contents);
		console.log(helper.parsed);
		console.log(helper.groups);
		console.log(helper.toPolylines());

		const scene: Scene = new Scene();
		const camera: Camera = new PerspectiveCamera(
			75,
			500 / 300, // TODO Bind to component element size
			0.1,
			1000
		);

		const renderer: WebGLRenderer = new WebGLRenderer();

		renderer.setSize(
			this.element.nativeElement.clientWidth,
			this.element.nativeElement.clientHeight
		); // TODO Bind size to the components element size

		this.element.nativeElement.appendChild(renderer.domElement);

		const geometry: Geometry = new BoxGeometry();
		const material: Material = new MeshBasicMaterial({color: 0x00ff00});
		const cube: Mesh = new Mesh(geometry, material);

		scene.add(cube);

		camera.position.z = 5;

		const animate: () => void = () => {
			window.requestAnimationFrame(animate);

			cube.rotation.x += 0.01;
			cube.rotation.y += 0.01;

			renderer.render(scene, camera);
		};

		// Run the animation outside angular to prevent change detection overhead
		this.zone.runOutsideAngular(() => {
			animate();
		});
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

			this.showCADFile(file);
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
