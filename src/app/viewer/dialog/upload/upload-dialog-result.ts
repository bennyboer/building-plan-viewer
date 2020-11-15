import {CanvasSource} from "../../canvas/source/canvas-source";

/**
 * Result of the upload dialog.
 */
export interface UploadDialogResult {

	/**
	 * Canvas source to display.
	 */
	canvasSource: CanvasSource;

	/**
	 * Optional room mapping.
	 */
	roomMappings?: RoomMapping[];

}

/**
 * Mapping for rooms.
 */
export interface RoomMapping {

	/**
	 * Name of the room.
	 */
	roomName: string;

	/**
	 * The rooms category.
	 */
	category: number;

	/**
	 * List of polygons describing the room.
	 */
	polygons: Polygon[];

}

/**
 * A polygon representation.
 */
export interface Polygon {

	/**
	 * X-coordinate of the polygon.
	 */
	x: number;

	/**
	 * Y-coordinate of the polygon.
	 */
	y: number;

}
