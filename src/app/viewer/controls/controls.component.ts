import {ChangeDetectionStrategy, Component, OnDestroy} from "@angular/core";
import {Observable, Subject} from "rxjs";

/**
 * Component displaying the viewer controls (load file, export, ...).
 */
@Component({
	selector: "app-viewer-controls",
	templateUrl: "controls.component.html",
	styleUrls: ["controls.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlsComponent implements OnDestroy {

	/**
	 * Subject emitting events when the load button has been clicked.
	 */
	private readonly _onLoadSubject: Subject<void> = new Subject<void>();

	/**
	 * Subject emitting events when the export button has been clicked.
	 */
	private readonly _onExportSubject: Subject<void> = new Subject<void>();

	/**
	 * Called on component destruction.
	 */
	public ngOnDestroy(): void {
		this._onLoadSubject.complete();
		this._onExportSubject.complete();
	}

	/**
	 * Called when the load button has been clicked.
	 */
	public onLoadClicked(): void {
		this._onLoadSubject.next();
	}

	/**
	 * Called when the export button has been clicked.
	 */
	public onExportClicked(): void {
		this._onExportSubject.next();
	}

	/**
	 * Get an observable of events when the load button has been clicked.
	 */
	get onLoad(): Observable<void> {
		return this._onLoadSubject.asObservable();
	}

	/**
	 * Get an observable of events when the export button has been clicked.
	 */
	get onExport(): Observable<void> {
		return this._onExportSubject.asObservable();
	}

}
