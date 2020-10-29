import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild} from "@angular/core";
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

}
