import {EntityHandler} from "./entity-handler";
import {CircleHandler} from "./circle-handler";
import {LWPolylineHandler} from "./lw-polyline-handler";

/**
 * Collection of available entity handlers.
 */
export class EntityHandlers {

	/**
	 * Available entity handlers mapped by the types they can deal with.
	 */
	private static readonly HANDLERS: Map<string, EntityHandler> = new Map<string, EntityHandler>([
		[CircleHandler.TYPE, new CircleHandler()],
		[LWPolylineHandler.TYPE, new LWPolylineHandler()],
	]);

	/**
	 * Get a handler for the passed type.
	 * @param type of the handler to fetch
	 */
	public static getHandler(type: string): EntityHandler | null {
		return this.HANDLERS.get(type);
	}

}
