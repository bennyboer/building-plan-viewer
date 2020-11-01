import {CanvasSource} from "../canvas-source";
import {Scene} from "three";
import {Dxf, DxfEntity} from "dxf";
import {EntityHandler} from "./handler/entity-handler";
import {EntityHandlers} from "./handler/entity-handlers";

/**
 * A canvas source read from DXF.
 */
export class DxfCanvasSource implements CanvasSource {

	/**
	 * Parsed DXF format.
	 */
	private readonly dxf: Dxf;

	constructor(dxf: Dxf) {
		this.dxf = dxf;
	}

	/**
	 * Draw the source on the given scene.
	 * @param scene to draw on
	 */
	public draw(scene: Scene): void {
		for (const entity of this.dxf.entities) {
			try {
				this.drawEntity(entity, scene);
			} catch (e) {
				console.warn(e.message);
			}
		}
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

		handler.process(entity, this.dxf, scene);
	}

}
