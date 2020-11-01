import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
	Input,
	OnDestroy,
	Renderer2
} from "@angular/core";
import {CanvasSource} from "./source/canvas-source";
import {
	BoxGeometry,
	Camera,
	Geometry,
	Material,
	Mesh,
	MeshBasicMaterial,
	OrthographicCamera,
	PerspectiveCamera,
	Scene,
	WebGLRenderer
} from "three";

/**
 * Component where the actual CAD file graphics are drawn on.
 */
@Component({
	selector: "app-canvas-component",
	templateUrl: "canvas.component.html",
	styleUrls: ["canvas.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvasComponent implements AfterViewInit, OnDestroy {

	/**
	 * Source that should be displayed by the component.
	 */
	private _source: CanvasSource;

	/**
	 * Current three.js Scene.
	 */
	private readonly scene: Scene = new Scene();

	/**
	 * Current three.js WebGL renderer.
	 */
	private readonly renderer: WebGLRenderer = new WebGLRenderer();

	/**
	 * Current three.js Camera.
	 */
	private camera: Camera;

	constructor(
		private readonly cd: ChangeDetectorRef,
		private readonly element: ElementRef,
		private readonly ngRenderer: Renderer2,
	) {
	}

	/**
	 * Get the source the component should display.
	 */
	get source(): CanvasSource {
		return this._source;
	}

	/**
	 * Set the source the component should display.
	 * @param value to set
	 */
	@Input("src")
	set source(value: CanvasSource) {
		this._source = value;

		this.onUpdated();
	}

	/**
	 * Called when the current source to display is updated.
	 */
	private onUpdated(): void {
		this._source.draw(this.scene);
	}

	/**
	 * Called after the component view is initialized.
	 */
	public ngAfterViewInit(): void {
		const bounds: DOMRect = this.element.nativeElement.getBoundingClientRect();

		this.camera = new OrthographicCamera(
			-bounds.width / 2,
			bounds.width / 2,
			bounds.height / 2,
			-bounds.height / 2,
		);

		this.renderer.setSize(
			this.element.nativeElement.clientWidth,
			this.element.nativeElement.clientHeight
		);
		this.renderer.setClearColor(0xfffffff, 1);

		this.ngRenderer.appendChild(this.element.nativeElement, this.renderer.domElement);

		const geometry: Geometry = new BoxGeometry();
		const material: Material = new MeshBasicMaterial({color: 0x00ff00});
		const cube: Mesh = new Mesh(geometry, material);
		cube.scale.multiplyScalar(100);

		this.scene.add(cube);

		this.camera.position.z = 10;

		const animate: () => void = () => {
			window.requestAnimationFrame(animate);

			cube.rotation.x += 0.01;
			cube.rotation.y += 0.01;

			this.renderer.render(this.scene, this.camera);
		};

		animate();
	}

	/**
	 * Called on the component destruction.
	 */
	public ngOnDestroy(): void {
		this.scene.dispose();
		this.renderer.dispose();
	}

	/**
	 * Listener on the windows resize event.
	 */
	@HostListener("window:resize", ["$event"])
	public onWindowResize(event: Event): void {
		const bounds: DOMRect = this.element.nativeElement.getBoundingClientRect();

		// Update camera projection
		if (this.camera instanceof PerspectiveCamera) {
			this.camera.aspect = bounds.width / bounds.height;
			this.camera.updateProjectionMatrix();
		} else if (this.camera instanceof OrthographicCamera) {
			this.camera.left = -bounds.width / 2;
			this.camera.right = bounds.width;
			this.camera.top = bounds.height / 2;
			this.camera.bottom = -bounds.height / 2;
			this.camera.updateProjectionMatrix();
		}

		// Update renderers canvas size
		this.renderer.setSize(bounds.width, bounds.height);
	}

}
