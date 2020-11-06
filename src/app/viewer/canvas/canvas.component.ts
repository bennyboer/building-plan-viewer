import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	HostListener,
	Input,
	OnDestroy,
	Output,
	Renderer2
} from "@angular/core";
import {CanvasSource} from "./source/canvas-source";
import {Camera, OrthographicCamera, PerspectiveCamera, Scene, WebGLRenderer} from "three";
import {Bounds2D, Bounds3D, BoundsUtil} from "./source/util/bounds";

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
	 * Default zoom setting.
	 */
	private static readonly DEFAULT_ZOOM: number = 0.9;

	/**
	 * Event emitter emitting events when a file has been rendered/loaded.
	 */
	@Output()
	private readonly load: EventEmitter<void> = new EventEmitter<void>();

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
	private readonly renderer: WebGLRenderer = new WebGLRenderer({
		antialias: true,
		alpha: true
	});

	/**
	 * Current three.js Camera.
	 */
	private camera: Camera;

	/**
	 * The last drawing bounds.
	 */
	private lastBounds: Bounds3D;

	/**
	 * Whether the canvas is initialized.
	 */
	private initialized: boolean = false;

	/**
	 * Whether a repaint is already requested.
	 */
	private repaintRequested: boolean = false;

	constructor(
		private readonly cd: ChangeDetectorRef,
		private readonly element: ElementRef,
		private readonly ngRenderer: Renderer2
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
	 * Clear the current scene from any objects previously drawn.
	 */
	private clearScene(): void {
		if (this.initialized) {
			this.scene.remove.apply(this.scene, this.scene.children);
		}
	}

	/**
	 * Called when the current source to display is updated.
	 */
	private async onUpdated(): Promise<void> {
		this.clearScene();

		const bounds: Bounds3D = this._source.draw(this.scene);

		this.updateViewport(bounds, true);

		this.load.emit();
	}

	/**
	 * Initialize the rendering.
	 * @param viewport to use for the canvas
	 */
	private initialize(viewport: Bounds2D): void {
		const elementBounds: DOMRect = this.element.nativeElement.getBoundingClientRect();

		const cam: OrthographicCamera = new OrthographicCamera(
			-viewport.width / 2,
			viewport.height / 2,
			viewport.height / 2,
			-viewport.width / 2,
		);
		cam.position.z = 1;
		this.camera = cam;

		this.renderer.setSize(
			elementBounds.width,
			elementBounds.height,
		);

		this.ngRenderer.appendChild(this.element.nativeElement, this.renderer.domElement);
	}

	/**
	 * Build the viewport of the canvas.
	 * @param bounds original (full) bounds of the scene
	 */
	private buildViewport(bounds: Bounds3D): Bounds2D {
		const viewport: Bounds2D = BoundsUtil.to2DBounds(bounds);

		// Find aspect ratio of the canvas element
		const elementBounds: DOMRect = this.element.nativeElement.getBoundingClientRect();
		const aspectRatio: number = elementBounds.width / elementBounds.height;

		// Transform viewport size with preferred aspect ratio
		const currentAspectRatio: number = viewport.width / viewport.height;
		if (currentAspectRatio < aspectRatio) {
			viewport.width = viewport.height * aspectRatio;
		} else if (currentAspectRatio > aspectRatio) {
			viewport.height = viewport.width / aspectRatio;
		}

		return viewport;
	}

	/**
	 * Update the current viewport.
	 * @param bounds original (full) bounds of the scene
	 * @param reset whether to reset the viewport to the initial setup
	 */
	private updateViewport(bounds: Bounds3D, reset: boolean) {
		const viewport: Bounds2D = this.buildViewport(bounds);

		if (!this.initialized) {
			this.initialized = true;
			this.initialize(viewport);
		}

		this.updateCameraProjection(viewport, reset);

		this.repaint();
	}

	/**
	 * Repaint the canvas.
	 */
	private async repaint(): Promise<void> {
		if (!this.repaintRequested) {
			this.repaintRequested = true;

			return new Promise<void>(
				resolve => window.requestAnimationFrame(() => {
					this.renderer.render(this.scene, this.camera);
					this.repaintRequested = false;

					resolve();
				})
			);
		}
	}

	/**
	 * Update the current cameras projection.
	 * @param viewport of the scene
	 * @param reset whether to initialize the camera to the initial position, zoom, etc.
	 */
	private updateCameraProjection(viewport: Bounds2D, reset: boolean): void {
		const elementBounds: DOMRect = this.element.nativeElement.getBoundingClientRect();

		if (this.camera instanceof PerspectiveCamera) {
			this.camera.aspect = elementBounds.width / elementBounds.height;

			if (reset) {
				this.camera.position.z = 1;
				this.camera.position.x = 0;
				this.camera.position.y = 0;
			}

			this.camera.updateProjectionMatrix();
		} else if (this.camera instanceof OrthographicCamera) {
			this.camera.left = -viewport.width / 2;
			this.camera.right = viewport.width / 2;
			this.camera.top = viewport.height / 2;
			this.camera.bottom = -viewport.height / 2;

			if (reset) {
				this.camera.position.z = 1;
				this.camera.position.x = viewport.left + viewport.width / 2;
				this.camera.position.y = viewport.top + viewport.height / 2;
				this.camera.zoom = CanvasComponent.DEFAULT_ZOOM;
			}

			this.camera.updateProjectionMatrix();
		}
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
			this.updateViewport(this.lastBounds, false);
		}

		// Update renderers canvas size
		this.renderer.setSize(bounds.width, bounds.height);
	}

}
