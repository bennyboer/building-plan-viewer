import {AbstractEntityHandler} from "./abstract-entity-handler";
import {Dxf, DxfCircleEntity, DxfEntity} from "../dxf";
import {ArcCurve, BufferGeometry, Line, LineBasicMaterial, Material, Object3D} from "three";
import {DxfCanvasSource} from "../dxf-canvas-source";
import {DxfGlobals} from "../util/dxf-globals";

/**
 * Handler being able to process Circle entities.
 */
export class CircleHandler extends AbstractEntityHandler {

	/**
	 * Type the handler is able to process.
	 */
	public static readonly TYPE: string = "CIRCLE";

	/**
	 * Process the passed entity.
	 * @param entity to process
	 * @param dxf the DXF format
	 * @param src the canvas source object
	 */
	public process(entity: DxfEntity, dxf: Dxf, src: DxfCanvasSource): Object3D {
		const e: DxfCircleEntity = entity as DxfCircleEntity;

		const arc: ArcCurve = new ArcCurve(
			0,
			0,
			e.r,
			0,
			2 * Math.PI,
			false,
		);

		const geometry: BufferGeometry = new BufferGeometry().setFromPoints(arc.getPoints(DxfGlobals.divisions));
		const material: Material = new LineBasicMaterial({color: this.retrieveColor(entity, dxf)});

		const result: Line = new Line(geometry, material);

		result.position.x = e.x;
		result.position.y = e.y;
		result.position.z = e.z;

		return result;
	}

}
