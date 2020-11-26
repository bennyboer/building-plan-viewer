import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input} from "@angular/core";

/**
 * Component displaying a legend for a color map.
 */
@Component({
	selector: "app-legend-component",
	templateUrl: "legend.component.html",
	styleUrls: ["legend.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegendComponent {

	/**
	 * Available categories and their color.
	 */
	private _mapping: Map<string, string> = new Map<string, string>();

	constructor(
		private readonly cd: ChangeDetectorRef
	) {
	}

	/**
	 * Set the mapping to display.
	 * @param mapping
	 */
	@Input()
	public set mapping(mapping: Map<string, string>) {
		this._mapping = mapping;
		this.cd.markForCheck();
	}

	/**
	 * Get the available mapping.
	 */
	public get mapping(): Map<string, string> {
		return this._mapping;
	}

}
