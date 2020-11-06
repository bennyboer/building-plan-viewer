import {AbstractEntityHandler} from "./abstract-entity-handler";
import {Dxf, DxfEntity, DxfLWPolylineEntity, DxfPosition} from "../dxf";
import {Geometry, Line, LineBasicMaterial, Material, Object3D, Vector3} from "three";

/**
 * Handler being able to process LWPolyline (lightweight polyline) entities.
 */
export class LWPolylineHandler extends AbstractEntityHandler {

	/**
	 * Type the handler is able to process.
	 */
	public static readonly TYPE: string = "LWPOLYLINE";

	/**
	 * Process the passed entity.
	 * @param entity to process
	 * @param dxf the DXF format
	 */
	public process(entity: DxfEntity, dxf: Dxf): Object3D {
		const e: DxfLWPolylineEntity = entity as DxfLWPolylineEntity;

		const geometry: Geometry = new Geometry();
		for (let i = 0; i < e.vertices.length; i++) {
			const vertex: DxfPosition = e.vertices[i];
			if (!!vertex.z) {
				vertex.z = 0;
			}

			geometry.vertices.push(new Vector3(vertex.x, vertex.y, vertex.z));
		}

		if (e.closed) {
			geometry.vertices.push(geometry.vertices[0]);
		}

		// TODO Support different line types (dashed, dotted, ...).

		const color: number = this.retrieveColor(entity, dxf);
		const material: Material = new LineBasicMaterial({linewidth: e.thickness ?? 1, color: color});

		return new Line(geometry, material);
	}

}
