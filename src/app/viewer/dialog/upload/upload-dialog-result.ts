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
	 * List of vertices describing the room.
	 */
	vertices: Vertex[];

}

/**
 * A polygon representation.
 */
export interface Vertex {

	/**
	 * X-coordinate of the polygon.
	 */
	x: number;

	/**
	 * Y-coordinate of the polygon.
	 */
	y: number;

}
