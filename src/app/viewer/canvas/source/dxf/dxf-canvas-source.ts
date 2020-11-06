import {CanvasSource} from "../canvas-source";
import {Box3, Object3D, Scene} from "three";
import {Dxf, DxfEntity} from "dxf";
import {EntityHandler} from "./handler/entity-handler";
import {EntityHandlers} from "./handler/entity-handlers";
import {Bounds3D} from "../util/bounds";
import {MTextHandler} from "./handler/mtext-handler";

/**
 * A canvas source read from DXF.
 */
export class DxfCanvasSource implements CanvasSource {

	/**
	 * Parsed DXF format.
	 */
	private readonly dxf: Dxf;

	/**
	 * Bounds of the drawn object.
	 */
	private bounds: Bounds3D = {
		x: {min: 0, max: 0},
		y: {min: 0, max: 0},
		z: {min: 0, max: 0},
	};

	constructor(dxf: Dxf) {
		this.dxf = dxf;
	}

	/**
	 * Draw the source on the given scene.
	 * @param scene to draw on
	 * @param progressConsumer consumer to publish the current progress in range [0; 100] over
	 */
	public async draw(scene: Scene, progressConsumer: (progress: number) => Promise<boolean>): Promise<Bounds3D> {
		this.resetBounds();

		await MTextHandler.init();

		const totalEntityCount: number = this.dxf.entities.length;
		let counter: number = 0;
		const publishProgressEvery: number = Math.round(totalEntityCount / 1000);
		for (const entity of this.dxf.entities) {
			try {
				this.drawEntity(entity, scene);
			} catch (e) {
				console.warn(e.message);
			}

			counter++;

			if (counter % publishProgressEvery === 0) {
				const cancelRequested: boolean = !(await progressConsumer(counter * 100 / totalEntityCount));
				if (cancelRequested) {
					break;
				}
			}
		}

		return this.bounds;
	}

	/**
	 * Draw the passed entity.
	 * @param entity to draw
	 * @param scene to draw onto
	 */
	private drawEntity(entity: DxfEntity, scene: Scene): void {
		const type: string = entity.type;

		const handler: EntityHandler = EntityHandlers.getHandler(type);
		if (!handler) {
			throw new Error(`Entity type '${type}' is not supported`);
		}

		const object: Object3D = handler.process(entity, this.dxf);
		scene.add(object);

		this.updateBounds(object);
	}

	/**
	 * Reset the bounds.
	 */
	private resetBounds(): void {
		this.bounds = {
			x: {min: null, max: null},
			y: {min: null, max: null},
			z: {min: null, max: null},
		};
	}

	/**
	 * Update the current bounds.
	 * @param object of a drawn object
	 */
	private updateBounds(object: Object3D) {
		const bounds: Box3 = new Box3().setFromObject(object);

		if (bounds.min.x !== undefined && bounds.min.x !== null) {
			if (!this.bounds.x.min || this.bounds.x.min > bounds.min.x) {
				this.bounds.x.min = bounds.min.x;
			}
		}
		if (bounds.max.x !== undefined && bounds.max.x !== null) {
			if (!this.bounds.x.max || this.bounds.x.max < bounds.max.x) {
				this.bounds.x.max = bounds.max.x;
			}
		}

		if (bounds.min.y !== undefined && bounds.min.y !== null) {
			if (!this.bounds.y.min || this.bounds.y.min > bounds.min.y) {
				this.bounds.y.min = bounds.min.y;
			}
		}
		if (bounds.max.y !== undefined && bounds.max.y !== null) {
			if (!this.bounds.y.max || this.bounds.y.max < bounds.max.y) {
				this.bounds.y.max = bounds.max.y;
			}
		}

		if (bounds.min.z !== undefined && bounds.min.z !== null) {
			if (!this.bounds.z.min || this.bounds.z.min > bounds.min.z) {
				this.bounds.z.min = bounds.min.z;
			}
		}
		if (bounds.max.z !== undefined && bounds.max.z !== null) {
			if (!this.bounds.z.max || this.bounds.z.max < bounds.max.z) {
				this.bounds.z.max = bounds.max.z;
			}
		}
	}

}
