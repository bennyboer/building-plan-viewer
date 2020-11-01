import {Scene} from "three";
import {Dxf, DxfEntity} from "../dxf";

/**
 * Handler dealing with drawing DXF entities.
 */
export interface EntityHandler {

	/**
	 * Process the passed entity.
	 * @param entity to process
	 * @param dxf the DXF format
	 * @param scene to draw on
	 */
	process(entity: DxfEntity, dxf: Dxf, scene: Scene): void;

}
