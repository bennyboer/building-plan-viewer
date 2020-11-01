/**
 * Parsed DXF object representation.
 */
export interface Dxf {

	/**
	 * Available blocks.
	 */
	blocks: DxfBlock[];

	/**
	 * Available entities.
	 */
	entities: DxfEntity[];

	/**
	 * Header of the DXF format.
	 */
	header: DxfHeader;

	/**
	 * Tables of the DXF format.
	 */
	tables: DxfTables;

}

/**
 * Tables of the DXF format.
 */
export interface DxfTables {

	/**
	 * Layers in the DXF.
	 */
	layers: any; // Map of string to DxfLayer

	/**
	 * Styles in the DXF.
	 */
	styles: any; // Map of string to DxfStyle

}

/**
 * Style of a DXF.
 */
export interface DxfStyle {

	/**
	 * Name of the style.
	 */
	name: string;

	bigFontFileName: string;

	/**
	 * Fixed text height.
	 */
	fixedTextHeight: number;

	/**
	 * Flags.
	 */
	flags: number;

	lastHeightUsed: number;

	obliqueAngle: number;

	primaryFontFileName: string;

	widthFactor: number;

}

/**
 * Layer of a DXF.
 */
export interface DxfLayer {

	/**
	 * Color number.
	 */
	colorNumber: number;

	/**
	 * Flags.
	 */
	flags: number;

	/**
	 * Name of the line type.
	 */
	lineTypeName: string;

	/**
	 * Enum of the line weight.
	 */
	lineWeightEnum: string;

	/**
	 * Name of the layer.
	 */
	name: string;

	/**
	 * Type of the layer.
	 */
	type: string;

}

/**
 * Header of the DXF format.
 */
export interface DxfHeader {

	extMax: DxfPosition;
	extMin: DxfPosition;
	insUnits: number;
	measurement: number;

}

/**
 * LWPolyline (lightweight polyline) entity.
 */
export interface DxfLWPolylineEntity extends DxfEntity {

	/**
	 * Vertices of the entity.
	 */
	vertices: DxfPosition[];

	/**
	 * Whether the line is closed.
	 */
	closed: boolean;

}

/**
 * A MText Entity.
 */
export interface DxfMTextEntity extends DxfEntity, DxfPosition {

	/**
	 * Text in the entity.
	 */
	string: string;

	/**
	 * Description of the text style (font family, ...).
	 */
	styleName: string;

	/**
	 * Rectangle width.
	 */
	refRectangleWidth: number;

	/**
	 * Nominal text height.
	 */
	nominalTextHeight: number;

	/**
	 * The drawing direction of the text.
	 */
	drawingDirection: number;

	/**
	 * Attachment point of the text.
	 */
	attachmentPoint: number;

}

/**
 * A Circle entity.
 */
export interface DxfCircleEntity extends DxfEntity, DxfPosition {

	/**
	 * Radius of the circle.
	 */
	r: number;

}

/**
 * A Line entity.
 */
export interface DxfLineEntity extends DxfEntity {

	/**
	 * Start of the line.
	 */
	start: DxfPosition;

	/**
	 * End of the line.
	 */
	end: DxfPosition;

}

/**
 * A Insert entity.
 */
export interface DxfInsertEntity extends DxfEntity, DxfPosition {

	/**
	 * Name of the block the entity belongs to.
	 */
	block: string;

}

/**
 * Entity of the DXF object.
 */
export interface DxfEntity {

	/**
	 * Layer on which the entity is on.
	 */
	layer: string;

	/**
	 * Type of the entity.
	 */
	type: string;

}

/**
 * Block of the DXF object.
 */
export interface DxfBlock extends DxfPosition {

	/**
	 * Name of the block.
	 */
	name: string;

	/**
	 * X-ref.
	 */
	xref: string;

}

/**
 * Entity of the DXF object.
 */
export interface DxfEntity {

	/**
	 * Number of the color.
	 */
	colorNumber: number;

	/**
	 * Start position.
	 */
	start: DxfPosition;

	/**
	 * End position.
	 */
	end: DxfPosition;

	/**
	 * Name of the layer.
	 */
	layer: string;

	/**
	 * Line type name.
	 */
	lineTypeName: string;

	/**
	 * Type of the entity.
	 */
	type: string;

}

/**
 * Position in a DXF object.
 */
export interface DxfPosition {

	/**
	 * X-coordinate.
	 */
	x: number;

	/**
	 * Y-coordinate.
	 */
	y: number;

	/**
	 * Z-coordinate.
	 */
	z: number;

}
