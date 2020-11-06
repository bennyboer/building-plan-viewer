import {AbstractEntityHandler} from "./abstract-entity-handler";
import {Dxf, Dxf3DFaceEntity, DxfEntity} from "../dxf";
import {Face3, Geometry, Material, Mesh, MeshBasicMaterial, Object3D, Vector3} from "three";

/**
 * Handler being able to process 3DFace entities.
 */
export class ThreeDFaceHandler extends AbstractEntityHandler {

	/**
	 * Type the handler is able to process.
	 */
	public static readonly TYPE: string = "3DFACE";

	/**
	 * Process the passed entity.
	 * @param entity to process
	 * @param dxf the DXF format
	 */
	public process(entity: DxfEntity, dxf: Dxf): Object3D {
		const e: Dxf3DFaceEntity = entity as Dxf3DFaceEntity;

		const geometry: Geometry = new Geometry();
		for (const vertex of e.vertices) {
			geometry.vertices.push(new Vector3(vertex.x, vertex.y, vertex.z));
		}

		// We need to determine the order of the points to find the faces: clockwise or counter-clockwise
		const v1: Vector3 = new Vector3();
		const v2: Vector3 = new Vector3();

		v1.subVectors(geometry.vertices[1], geometry.vertices[0]);
		v2.subVectors(geometry.vertices[2], geometry.vertices[0]);
		v1.cross(v2);

		const reverse: boolean = v1.z < 0;
		if (reverse) {
			geometry.faces.push(new Face3(2, 1, 0));
			geometry.faces.push(new Face3(2, 3, 0));
		} else {
			geometry.faces.push(new Face3(0, 1, 2));
			geometry.faces.push(new Face3(1, 3, 2));
		}

		const color: number = this.retrieveColor(entity, dxf);
		const material: Material = new MeshBasicMaterial({color: color});

		return new Mesh(geometry, material);
	}

}
