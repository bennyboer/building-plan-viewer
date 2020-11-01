/**
 * Utility methods regarding files.
 */
export class FileUtil {

	/**
	 * Read the passed file.
	 * @param file to read
	 */
	public static async readFile(file: File): Promise<string | ArrayBuffer> {
		const reader: FileReader = new FileReader();

		const promise: Promise<string | ArrayBuffer> = new Promise<string | ArrayBuffer>(
			resolve => {
				reader.onload = (e) => {
					resolve(e.target.result);
				};
			}
		);

		reader.readAsText(file);

		return await promise;
	}

	/**
	 * Open a file chooser dialog and return the selected files.
	 */
	public static async openFileChooser(): Promise<FileList> {
		const input: HTMLInputElement = this.createDummyFileInput();
		input.click();

		const files: FileList = await new Promise<FileList>(
			resolve => {
				let changeListener: (Event) => void = null;
				changeListener = (event) => {
					resolve(event.target.files);

					input.removeEventListener("change", changeListener);
				};
				input.addEventListener("change", changeListener);
			}
		);

		this.removeDummyFileInput(input);

		return files;
	}

	/**
	 * Get the file ending of the passed file.
	 * @param file to get file ending for
	 */
	public static getFileEnding(file: File): string | null {
		const parts: string[] = file.name.split(".");
		if (parts.length == 1 && !file.name.startsWith(".")) {
			return null;
		}

		return parts[parts.length - 1];
	}

	/**
	 * Create a dummy file input element in DOM and return a reference to it.
	 */
	private static createDummyFileInput(): HTMLInputElement {
		const input: HTMLInputElement = document.createElement("input");
		input.setAttribute("type", "file");
		input.style.visibility = "hidden";
		input.style.position = "absolute";
		input.style.left = "-9999px";

		// Add it to body
		const body: HTMLBodyElement = document.querySelector("body");
		body.appendChild(input);

		return input;
	}

	/**
	 * Remove the passed dummy file input from DOM.
	 * @param input to remove from DOM
	 */
	private static removeDummyFileInput(input: HTMLInputElement): void {
		const body: HTMLBodyElement = document.querySelector("body");
		body.removeChild(input);
	}

}
