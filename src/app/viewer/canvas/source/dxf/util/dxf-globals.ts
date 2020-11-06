/**
 * Global settings for the Dxf drawing/reading process.
 */
export class DxfGlobals {

	/**
	 * Contrast color.
	 */
	private static contrastColor: number = 0x000000;

	/**
	 * Background color.
	 */
	private static backgroundColor: number = 0xFFFFFF;

	/**
	 * Get the contrast color.
	 */
	public static getContrastColor(): number {
		return this.contrastColor;
	}

	/**
	 * Set the contrast color.
	 * @param color to set
	 */
	public static setContrastColor(color: number): void {
		this.contrastColor = color;
	}

	/**
	 * Get the background color.
	 */
	public static getBackgroundColor(): number {
		return this.backgroundColor;
	}

	/**
	 * Set the background color.
	 * @param color to set
	 */
	public static setBackgroundColor(color: number): void {
		this.backgroundColor = color;
	}

}
