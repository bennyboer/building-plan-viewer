import {CanvasSourceReader} from "./canvas-source-reader";
import {DxfCanvasSourceReader} from "./dxf/dxf-canvas-source-reader";
import {FileUtil} from "../../../util/file-util";

/**
 * Collection of available canvas source readers.
 */
export class CanvasSourceReaders {

	/**
	 * Map holding available readers by the file endings of the files the readers can read.
	 */
	private static readonly READERS = new Map<string, CanvasSourceReader>([
		["dxf", new DxfCanvasSourceReader()],
	]);

	/**
	 * Get a reader for the passed file.
	 * @param file to get reader for
	 */
	public static getReader(file: File): CanvasSourceReader | null {
		// Fetch file ending
		const ending: string = FileUtil.getFileEnding(file);

		return this.READERS.get(ending.toLowerCase());
	}

}