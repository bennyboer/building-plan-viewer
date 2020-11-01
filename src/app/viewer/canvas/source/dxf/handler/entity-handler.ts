import {Object3D} from "three";
import {Dxf, DxfEntity} from "../dxf";

/**
 * Handler dealing with drawing DXF entities.
 */
export interface EntityHandler {

	/**
	 * Process the passed entity.
	 * @param entity to process
	 * @param dxf the DXF format
	 */
	process(entity: DxfEntity, dxf: Dxf): Object3D;

}
