import {Scene} from "three";
import {Bounds} from "./util/bounds";

/**
 * Source digestible by the canvas component.
 */
export interface CanvasSource {

	/**
	 * Draw the source on the given scene.
	 * @param scene to draw on
	 */
	draw(scene: Scene): Bounds;

}
