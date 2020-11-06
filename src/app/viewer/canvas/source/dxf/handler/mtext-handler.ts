import {AbstractEntityHandler} from "./abstract-entity-handler";
import {Dxf, DxfEntity, DxfMTextEntity} from "../dxf";
import {Font, FontLoader, LineBasicMaterial, Material, Mesh, Object3D, TextGeometry} from "three";

/**
 * Handler being able to process MText entities.
 */
export class MTextHandler extends AbstractEntityHandler {

	/**
	 * Type the handler is able to process.
	 */
	public static readonly TYPE: string = "MTEXT";

	/**
	 * Load the font to use for three.js.
	 */
	private static async loadFont(): Promise<Font> {
		const loader: FontLoader = new FontLoader();
		return new Promise(
			resolve => {
				loader.load("/assets/fonts/Roboto_Regular.json",
					(font) => {
						resolve(font);
					});
			}
		);
	}

	/**
	 * The font to use for three.js.
	 */
	private static font: Font;

	/**
	 * Initialize the handler.
	 */
	public static async init(): Promise<void> {
		if (!MTextHandler.font) {
			MTextHandler.font = await MTextHandler.loadFont();
		}
	}

	/**
	 * Process the passed entity.
	 * @param entity to process
	 * @param dxf the DXF format
	 */
	public process(entity: DxfEntity, dxf: Dxf): Object3D {
		const e: DxfMTextEntity = entity as DxfMTextEntity;
		console.log(e);

		const geometry: TextGeometry = new TextGeometry(e.string, {
			font: MTextHandler.font,
			height: 0,
			size: e.nominalTextHeight || 11
		});

		if (!!e.xAxisX) {
			geometry.rotateZ(e.xAxisX * Math.PI / 180);
		}

		const material: Material = new LineBasicMaterial({color: this.retrieveColor(entity, dxf)});

		const result: Mesh = new Mesh(geometry, material);
		result.position.x = e.x;
		result.position.y = e.y;
		result.position.z = e.z;

		return result;
	}

}
