import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, Input, OnDestroy, Renderer2} from "@angular/core";
import {CanvasSource} from "./source/canvas-source";
import {Camera, OrthographicCamera, PerspectiveCamera, Scene, WebGLRenderer} from "three";
import {Bounds} from "./source/util/bounds";

/**
 * Component where the actual CAD file graphics are drawn on.
 */
@Component({
	selector: "app-canvas-component",
	templateUrl: "canvas.component.html",
	styleUrls: ["canvas.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvasComponent implements OnDestroy {

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

	/**
	 * The last drawing bounds.
	 */
	private lastBounds: Bounds;

	/**
	 * Whether the canvas is initialized.
	 */
	private initialized: boolean = false;

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
		const bounds: Bounds = this._source.draw(this.scene);

		this.updateViewport(bounds);
	}

	/**
	 * Initialize the rendering.
	 */
	private initialize(x: number, y: number, width: number, height: number): void {
		this.camera = new OrthographicCamera(
			-width / 2,
			width / 2,
			height / 2,
			-height / 2,
		);
		this.camera.position.z = 10;

		const elementBounds: DOMRect = this.element.nativeElement.getBoundingClientRect();
		this.renderer.setSize(
			elementBounds.width,
			elementBounds.height,
		);
		this.renderer.setClearColor(0xfffffff, 1);

		this.ngRenderer.appendChild(this.element.nativeElement, this.renderer.domElement);
	}

	/**
	 * Update the current viewport.
	 */
	private updateViewport(bounds: Bounds) {
		const elementBounds: DOMRect = this.element.nativeElement.getBoundingClientRect();
		const aspectRatio: number = elementBounds.width / elementBounds.height;

		// Build viewport
		const x: number = bounds.x.min;
		const y: number = bounds.y.min;

		let width: number = bounds.x.max - bounds.x.min;
		let height: number = bounds.y.max - bounds.y.min;

		// Transform viewport size with preferred aspect ratio
		const currentAspectRatio: number = width / height;
		if (currentAspectRatio < aspectRatio) {
			width = height * aspectRatio;
		} else if (currentAspectRatio > aspectRatio) {
			height = width / aspectRatio;
		}

		if (!this.initialized) {
			this.initialized = true;
			this.initialize(x, y, width, height);
		}

		// Update camera projection
		if (this.camera instanceof PerspectiveCamera) {
			this.camera.aspect = aspectRatio;
			this.camera.updateProjectionMatrix();
		} else if (this.camera instanceof OrthographicCamera) {
			this.camera.left = -width / 2;
			this.camera.right = width / 2;
			this.camera.top = height / 2;
			this.camera.bottom = -height / 2;
			this.camera.updateProjectionMatrix();

			this.camera.position.x = x + width / 2;
			this.camera.position.y = y + height / 2;
		}

		this.renderer.render(this.scene, this.camera);
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

		if (!!this.lastBounds) {
			this.updateViewport(this.lastBounds);
		}

		// Update renderers canvas size
		this.renderer.setSize(bounds.width, bounds.height);
	}

}
