import {Scene} from "three";
import {Bounds3D} from "./util/bounds";

/**
 * Source digestible by the canvas component.
 */
export interface CanvasSource {

	/**
	 * Draw the source on the given scene.
	 * @param scene to draw on
	 * @param progressConsumer consumer to publish the current progress in range [0; 100] over
	 */
	draw(scene: Scene, progressConsumer: (progress: number) => Promise<boolean>): Promise<Bounds3D>;

}
