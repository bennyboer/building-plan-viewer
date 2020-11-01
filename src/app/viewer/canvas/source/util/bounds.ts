/**
 * 3D boundaries.
 */
export interface Bounds {

	/**
	 * X-axis dimension range.
	 */
	x: DimensionRange;

	/**
	 * Y-axis dimension range.
	 */
	y: DimensionRange;

	/**
	 * Z-axis dimension range.
	 */
	z: DimensionRange;

}

/**
 * Range of a dimension.
 */
export interface DimensionRange {

	/**
	 * Minimum of the range.
	 */
	min: number;

	/**
	 * Maximum of the range.
	 */
	max: number;

}
