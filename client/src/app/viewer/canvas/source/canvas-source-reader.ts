import {CanvasSource} from "./canvas-source";

/**
 * Reader for a canvas source.
 */
export interface CanvasSourceReader {

	/**
	 * Read a canvas source from the passed file.
	 * @param file to read canvas source from
	 */
	read(file: File): Promise<CanvasSource>;

}
