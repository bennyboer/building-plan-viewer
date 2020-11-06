import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
	Input,
	OnDestroy,
	OnInit,
	Renderer2
} from "@angular/core";
import {CanvasSource} from "./source/canvas-source";
import {Camera, OrthographicCamera, PerspectiveCamera, Scene, WebGLRenderer} from "three";
import {Bounds2D, Bounds3D, BoundsUtil} from "./source/util/bounds";
import {ThemeService} from "../../util/theme/theme.service";
import {Observable, Subject, Subscription} from "rxjs";
import {DxfGlobals} from "./source/dxf/util/dxf-globals";
import {DeviceUtil} from "../../util/device-util";
import {DOWN_ARROW, LEFT_ARROW, RIGHT_ARROW, UP_ARROW} from "@angular/cdk/keycodes";

/**
 * Component where the actual CAD file graphics are drawn on.
 */
@Component({
	selector: "app-canvas-component",
	templateUrl: "canvas.component.html",
	styleUrls: ["canvas.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvasComponent implements OnDestroy, OnInit {

	/**
	 * Default zoom setting.
	 */
	private static readonly DEFAULT_ZOOM: number = 0.9;

	/**
	 * Acceleration factor for the arrow key navigation.
	 * A factor of for example 0.01 would mean that the movement
	 * speed would accelerate by 1% of the scene width (or height) per second.
	 */
	private static readonly ARROW_KEY_NAVIGATION_ACCELERATION_FACTOR: number = 4.0;

	/**
	 * Factor with which the current speed will be slowed
	 * each second when no arrow key in one direction is active.
	 */
	private static readonly ARROW_KEY_NAVIGATION_SLOW_FACTOR: number = 5.0;

	/**
	 * Maximum speed of the arrow key navigation given as factor of the current
	 * scene width or height.
	 */
	private static readonly ARROW_KEY_NAVIGATION_MAX_SPEED_FACTOR: number = 0.8;

	/**
	 * Event emitter emitting events when a file has started or finished rendering/loading.
	 */
	private readonly load: Subject<LoadEvent> = new Subject<LoadEvent>();

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
	 * The current viewport.
	 */
	private currentViewport: Bounds2D;

	/**
	 * Whether the canvas is initialized.
	 */
	private initialized: boolean = false;

	/**
	 * Whether a repaint is already requested.
	 */
	private repaintRequested: boolean = false;

	/**
	 * Subscription to theme changes.
	 */
	private themeChangeSub: Subscription;

	/**
	 * Event listener for key down events.
	 */
	private windowKeyDownListener: (event: KeyboardEvent) => void;

	/**
	 * Event listener for key up events.
	 */
	private windowKeyUpListener: (event: KeyboardEvent) => void;

	/**
	 * Whether arrow key navigation is currently in progress.
	 */
	private isArrowKeyNavigationInProgress: boolean = false;

	/**
	 * Registry for currently pressed keys.
	 */
	private pressedKeyRegistry: PressedKeyRegistry = {
		up: false,
		down: false,
		left: false,
		right: false
	};

	/**
	 * Current speed vector of arrow key navigation.
	 * It is given in percent of the current scene width per second.
	 * For example a vector of [0.01, -0.02] would mean we would
	 * navigate with a speed of 1 % of the scene width per second in horizontal direction (to the right)
	 * and 2% of the scene width in vertical direction (to the top).
	 */
	private currentArrowKeyNavigationSpeedVector: [number, number] = [0, 0];

	/**
	 * Timestamp of the last key navigation step.
	 */
	private lastKeyNavigationTimestamp: number = -1;

	constructor(
		private readonly cd: ChangeDetectorRef,
		private readonly element: ElementRef,
		private readonly ngRenderer: Renderer2,
		private readonly themeService: ThemeService,
	) {
	}

	/**
	 * Get a stream of load events.
	 */
	public get loadEvents(): Observable<LoadEvent> {
		return this.load.asObservable();
	}

	/**
	 * Get the source the component should display.
	 */
	public get source(): CanvasSource {
		return this._source;
	}

	/**
	 * Set the source the component should display.
	 * @param value to set
	 */
	@Input("src")
	public set source(value: CanvasSource) {
		this._source = value;

		this.onUpdated(true);
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
	 * @param reset whether to reset the viewport to the initial state
	 */
	private onUpdated(reset: boolean): void {
		this.load.next({
			isLoading: true, progress: 0, continueLoading: () => {
			},
			cancelLoading: () => {
			}
		});

		this.onUpdatedInternal(reset).then(() => {
			this.load.next({
				isLoading: false, progress: 100, continueLoading: () => {
				},
				cancelLoading: () => {
				}
			});
		});
	}

	/**
	 * Internal on update method.
	 * @param reset whether to reset the viewport to the initial state
	 */
	private async onUpdatedInternal(reset: boolean): Promise<void> {
		this.clearScene();

		const bounds: Bounds3D = await this._source.draw(this.scene, async (progress) => {
			return await new Promise<boolean>(
				(resolve) => {
					this.load.next({
						isLoading: true,
						progress,
						continueLoading: () => {
							resolve(true);
						},
						cancelLoading: () => {
							resolve(false);
						}
					});
				}
			);
		});
		this.lastBounds = bounds;

		this.updateViewport(bounds, reset);
	}

	/**
	 * Initialize the rendering.
	 * @param viewport to use for the canvas
	 */
	private initialize(viewport: Bounds2D): void {
		const elementBounds: DOMRect = this.element.nativeElement.getBoundingClientRect();

		const cam: OrthographicCamera = new OrthographicCamera(
			-viewport.width / 2,
			viewport.width / 2,
			viewport.height / 2,
			-viewport.height / 2,
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
		this.currentViewport = viewport;

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
	 * Repaint the scene immediately.
	 */
	private repaintImmediately(): void {
		this.renderer.render(this.scene, this.camera);
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
	 * Called on component initialization.
	 */
	public ngOnInit(): void {
		this.onInitHandleThemeChanges();
		this.setupUserNavigation();
	}

	/**
	 * Handle theme changes on initialization.
	 */
	private onInitHandleThemeChanges(): void {
		if (this.themeService.darkMode) {
			DxfGlobals.setContrastColor(0xFAFAFA);
			DxfGlobals.setBackgroundColor(0x2C2C2C);
		} else {
			DxfGlobals.setContrastColor(0x2C2C2C);
			DxfGlobals.setBackgroundColor(0xFAFAFA);
		}

		this.themeChangeSub = this.themeService.changes.subscribe(isDarkMode => {
			if (isDarkMode) {
				DxfGlobals.setContrastColor(0xFAFAFA);
				DxfGlobals.setBackgroundColor(0x2C2C2C);
			} else {
				DxfGlobals.setContrastColor(0x2C2C2C);
				DxfGlobals.setBackgroundColor(0xFAFAFA);
			}

			if (!!this.source) {
				this.onUpdated(false);
			}
		});
	}

	/**
	 * Setup the user navigation (keyboard, mouse, touch).
	 */
	private setupUserNavigation(): void {
		this.registerUserNavigationWithKeyboard();
		this.registerUserNavigationUsingMouse();

		if (DeviceUtil.isTouchSupported()) {
			this.registerUserNavigationWithTouch();
		}
	}

	/**
	 * Register user navigation using keyboard input.
	 */
	private registerUserNavigationWithKeyboard(): void {
		this.windowKeyDownListener = event => this.onKeyDown(event);
		this.windowKeyUpListener = event => this.onKeyUp(event);

		window.addEventListener("keydown", this.windowKeyDownListener);
		window.addEventListener("keyup", this.windowKeyUpListener);
	}

	/**
	 * Unregister user navigation using keyboard input.
	 */
	private unregisterUserNavigationWithKeyboard(): void {
		window.removeEventListener("keydown", this.windowKeyDownListener);
		window.removeEventListener("keyup", this.windowKeyUpListener);
	}

	/**
	 * Called when a key on the keyboard is down.
	 * @param event that occurred
	 */
	private onKeyDown(event: KeyboardEvent): void {
		switch (event.keyCode) {
			case UP_ARROW:
			case DOWN_ARROW:
			case LEFT_ARROW:
			case RIGHT_ARROW:
				this.onArrowKeyChanged(event.keyCode, true);
				break;
		}
	}

	/**
	 * Called when a key on the keyboard is up.
	 * @param event that occurred
	 */
	private onKeyUp(event: KeyboardEvent): void {
		switch (event.keyCode) {
			case UP_ARROW:
			case DOWN_ARROW:
			case LEFT_ARROW:
			case RIGHT_ARROW:
				this.onArrowKeyChanged(event.keyCode, false);
				break;
		}
	}

	/**
	 * Called when an arrow keys status has changed..
	 * @param keyCode of the arrow key
	 * @param isDown whether the key is currently down
	 */
	private onArrowKeyChanged(keyCode: number, isDown: boolean): void {
		switch (keyCode) {
			case UP_ARROW:
				this.pressedKeyRegistry.up = isDown;
				break;
			case DOWN_ARROW:
				this.pressedKeyRegistry.down = isDown;
				break;
			case LEFT_ARROW:
				this.pressedKeyRegistry.left = isDown;
				break;
			case RIGHT_ARROW:
				this.pressedKeyRegistry.right = isDown;
				break;
		}

		if (isDown) {
			this.startArrowKeyNavigation();
		}
	}

	/**
	 * Start the arrow key navigation of the scene.
	 */
	private startArrowKeyNavigation(): void {
		if (this.isArrowKeyNavigationInProgress) {
			return;
		}

		this.isArrowKeyNavigationInProgress = true;

		let keyNavigationFunction: () => void;
		keyNavigationFunction = () => {
			window.requestAnimationFrame((timestamp) => {
				const isInitialLoop: boolean = this.lastKeyNavigationTimestamp === -1;

				// Get time difference in millseconds between now and the last animation frame.
				const diff: number = !isInitialLoop ? timestamp - this.lastKeyNavigationTimestamp : 0;
				this.lastKeyNavigationTimestamp = timestamp;

				// Accelerate or slow the current speed vector based on
				// whether the keys are currently pressed.
				let currentXSpeed: number = this.currentArrowKeyNavigationSpeedVector[0];
				let currentYSpeed: number = this.currentArrowKeyNavigationSpeedVector[1];

				if (this.pressedKeyRegistry.up) {
					currentYSpeed += this.currentViewport.height * CanvasComponent.ARROW_KEY_NAVIGATION_ACCELERATION_FACTOR * diff / 1000;
				} else if (this.pressedKeyRegistry.down) {
					currentYSpeed -= this.currentViewport.height * CanvasComponent.ARROW_KEY_NAVIGATION_ACCELERATION_FACTOR * diff / 1000;
				} else {
					// Slow vertical speed down to zero
					if (currentYSpeed > 0) {
						currentYSpeed = Math.max(0, currentYSpeed - currentYSpeed * CanvasComponent.ARROW_KEY_NAVIGATION_SLOW_FACTOR * diff / 1000);
					} else {
						currentYSpeed = Math.min(0, currentYSpeed - currentYSpeed * CanvasComponent.ARROW_KEY_NAVIGATION_SLOW_FACTOR * diff / 1000);
					}
				}

				if (this.pressedKeyRegistry.left) {
					currentXSpeed -= this.currentViewport.width * CanvasComponent.ARROW_KEY_NAVIGATION_ACCELERATION_FACTOR * diff / 1000;
				} else if (this.pressedKeyRegistry.right) {
					currentXSpeed += this.currentViewport.width * CanvasComponent.ARROW_KEY_NAVIGATION_ACCELERATION_FACTOR * diff / 1000;
				} else {
					// Slow horizontal speed down to zero
					if (currentXSpeed > 0) {
						currentXSpeed = Math.max(0, currentXSpeed - currentXSpeed * CanvasComponent.ARROW_KEY_NAVIGATION_SLOW_FACTOR * diff / 1000);
					} else {
						currentXSpeed = Math.min(0, currentXSpeed - currentXSpeed * CanvasComponent.ARROW_KEY_NAVIGATION_SLOW_FACTOR * diff / 1000);
					}
				}

				// Correct speeds that exceed the maximum speed
				const xSpeedFactor: number = Math.abs(currentXSpeed) / this.currentViewport.width;
				if (xSpeedFactor > CanvasComponent.ARROW_KEY_NAVIGATION_MAX_SPEED_FACTOR) {
					currentXSpeed = currentXSpeed / xSpeedFactor * CanvasComponent.ARROW_KEY_NAVIGATION_MAX_SPEED_FACTOR;
				}

				const ySpeedFactor: number = Math.abs(currentYSpeed) / this.currentViewport.height;
				if (ySpeedFactor > CanvasComponent.ARROW_KEY_NAVIGATION_MAX_SPEED_FACTOR) {
					currentYSpeed = currentYSpeed / ySpeedFactor * CanvasComponent.ARROW_KEY_NAVIGATION_MAX_SPEED_FACTOR;
				}

				this.currentArrowKeyNavigationSpeedVector[0] = currentXSpeed;
				this.currentArrowKeyNavigationSpeedVector[1] = currentYSpeed;

				// Adjust camera position using the current speed vector
				if (currentXSpeed !== 0 || currentYSpeed !== 0 || isInitialLoop) {
					this.camera.position.x += currentXSpeed * diff / 1000;
					this.camera.position.y += currentYSpeed * diff / 1000;

					// Re-render the scene
					this.repaintImmediately();

					keyNavigationFunction();
				} else {
					// Leave key navigation rendering loop, as there is no more movement
					this.lastKeyNavigationTimestamp = -1;
					this.isArrowKeyNavigationInProgress = false;
				}
			});
		};

		keyNavigationFunction();
	}

	/**
	 * Register user navigation using mouse input.
	 */
	private registerUserNavigationUsingMouse(): void {
		// TODO
	}

	/**
	 * Unregister user navigation using mouse input.
	 */
	private unregisterUserNavigationWithMouse(): void {
		// TODO
	}

	/**
	 * Register user navigation using touch input.
	 */
	private registerUserNavigationWithTouch(): void {
		// TODO
	}

	/**
	 * Unregister user navigation using touch input.
	 */
	private unregisterUserNavigationWithTouch(): void {
		// TODO
	}

	/**
	 * Called on the component destruction.
	 */
	public ngOnDestroy(): void {
		this.scene.dispose();
		this.renderer.dispose();

		this.load.complete();

		this.themeChangeSub.unsubscribe();

		this.unregisterUserNavigationWithKeyboard();
		this.unregisterUserNavigationWithMouse();
		this.unregisterUserNavigationWithTouch();
	}

	/**
	 * Listener on the windows resize event.
	 */
	@HostListener("window:resize", ["$event"])
	public onWindowResize(event: Event): void {
		const bounds: DOMRect = this.element.nativeElement.getBoundingClientRect();

		// Update renderers canvas size
		this.renderer.setSize(bounds.width, bounds.height);

		if (!!this.lastBounds) {
			this.updateViewport(this.lastBounds, false);
		}
	}

}

/**
 * Load events published by the canvas component.
 */
export interface LoadEvent {

	/**
	 * Current progress in range [0; 100].
	 */
	progress: number;

	/**
	 * Whether loading is in progress.
	 */
	isLoading: boolean;

	/**
	 * Function that must be called to continue loading.
	 */
	continueLoading: () => void;

	/**
	 * Function that must be called to cancel loading.
	 */
	cancelLoading: () => void;

}

/**
 * Registry for currently pressed arrow keys.
 */
interface PressedKeyRegistry {

	/**
	 * Whether the left key is currently down.
	 */
	left: boolean;

	/**
	 * Whether the right key is currently down.
	 */
	right: boolean;

	/**
	 * Whether the top key is currently down.
	 */
	up: boolean;

	/**
	 * Whether the bottom key is currently down.
	 */
	down: boolean;

}
