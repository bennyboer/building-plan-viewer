import {ChangeDetectionStrategy, Component, ElementRef, NgZone, OnDestroy, OnInit} from "@angular/core";
import {BoxGeometry, Camera, Geometry, Material, Mesh, MeshBasicMaterial, PerspectiveCamera, Scene, WebGLRenderer} from "three";
import * as DXF from "dxf";

/**
 * Viewer component displaying the building plan, etc.
 */
@Component({
	selector: "app-viewer-component",
	templateUrl: "viewer.component.html",
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewerComponent implements OnInit, OnDestroy {

	constructor(
		private readonly element: ElementRef,
		private readonly zone: NgZone
	) {
	}

	/**
	 * Called on component destruction.
	 */
	public ngOnDestroy(): void {
	}

	/**
	 * Called on component initialization.
	 */
	public ngOnInit(): void {
		const scene: Scene = new Scene();
		const camera: Camera = new PerspectiveCamera(
			75,
			500 / 300, // TODO Bind to component element size
			0.1,
			1000
		);

		const renderer: WebGLRenderer = new WebGLRenderer();

		renderer.setSize(
			500,
			300
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

	public readFile(file: File): void {
		// for (let i = 0; i < 5; i++) {
		// 	PerformanceTest.readFile(file);
		// }

		const reader: FileReader = new FileReader();
		reader.onload = (e) => {
			const contents: string | ArrayBuffer = e.target.result;

			const helper = new DXF.Helper(contents);
			console.log(helper.parsed);
			console.log(helper.denormalized);
			console.log(helper.toPolylines());
		};
		reader.readAsText(file);
	}

}
