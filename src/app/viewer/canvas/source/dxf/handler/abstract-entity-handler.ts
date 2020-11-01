import {EntityHandler} from "./entity-handler";
import {Object3D} from "three";
import {Dxf, DxfEntity, DxfLayer} from "../dxf";

/**
 * Abstract entity handler.
 */
export abstract class AbstractEntityHandler implements EntityHandler {

	/**
	 * The default color in case none is specified.
	 */
	private static readonly DEFAULT_COLOR: number = 0x000000;

	/**
	 * Process the passed entity.
	 * @param entity to process
	 * @param dxf the DXF format
	 */
	abstract process(entity: DxfEntity, dxf: Dxf): Object3D;

	/**
	 * Retrieve a color from the passed entity and DXF.
	 * @param entity to get color from
	 * @param dxf to get color from
	 */
	protected retrieveColor(entity: DxfEntity, dxf: Dxf): number {
		if (!!entity.colorNumber) {
			return entity.colorNumber;
		} else if (!!dxf.tables && !!dxf.tables.layers && !!dxf.tables.layers[entity.layer]) {
			const layer: DxfLayer = dxf.tables.layers[entity.layer];
			return layer.colorNumber;
		} else {
			return AbstractEntityHandler.DEFAULT_COLOR;
		}
	}

}
