import {CanvasSourceReader} from "../canvas-source-reader";
import {CanvasSource} from "../canvas-source";
import {DxfCanvasSource} from "./dxf-canvas-source";
import {FileUtil} from "../../../../util/file-util";
import {Dxf, Helper} from "dxf";

/**
 * Reader for canvas sources from DXF files.
 */
export class DxfCanvasSourceReader implements CanvasSourceReader {

	/**
	 * Read the passed file in DXF format.
	 * @param file to read
	 */
	public async read(file: File): Promise<CanvasSource> {
		const contents: string | ArrayBuffer = await FileUtil.readFile(file);

		const helper: Helper = new Helper(contents);

		return new DxfCanvasSource(helper.parsed as Dxf);
	}

}
