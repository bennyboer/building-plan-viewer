import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from "@angular/core";
import {Observable, Subject, Subscription} from "rxjs";
import {MatSlideToggleChange} from "@angular/material/slide-toggle";
import {ThemeService} from "../../util/theme/theme.service";

/**
 * Component displaying the viewer controls (load file, export, ...).
 */
@Component({
	selector: "app-viewer-controls",
	templateUrl: "controls.component.html",
	styleUrls: ["controls.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlsComponent implements OnInit, OnDestroy {

	/**
	 * Subject emitting events when the load button has been clicked.
	 */
	private readonly _onLoadSubject: Subject<void> = new Subject<void>();

	/**
	 * Subject emitting events when the export button has been clicked.
	 */
	private readonly _onExportSubject: Subject<void> = new Subject<void>();

	/**
	 * Subject emitting events when the viewport reset button has been clicked.
	 */
	private readonly _onViewportResetSubject: Subject<void> = new Subject<void>();

	/**
	 * Subscription to theme changes.
	 */
	private themeChangeSub: Subscription;

	/**
	 * Whether dark mode is currently activated.
	 */
	public isDarkMode: boolean = false;

	constructor(
		private readonly themeService: ThemeService
	) {
	}

	/**
	 * Called on component destruction.
	 */
	public ngOnDestroy(): void {
		this._onLoadSubject.complete();
		this._onExportSubject.complete();
		this._onViewportResetSubject.complete();

		this.themeChangeSub.unsubscribe();
	}

	/**
	 * Called on component initialization.
	 */
	public ngOnInit(): void {
		this.isDarkMode = this.themeService.darkMode;
		this.themeChangeSub = this.themeService.changes.subscribe((darkMode) => {
			this.isDarkMode = darkMode;
		});
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
	 * Called when the viewport reset button has been clicked.
	 */
	public onViewportResetClicked(): void {
		this._onViewportResetSubject.next();
	}

	/**
	 * Called on theme change.
	 * @param event which occurred
	 */
	public onThemeChange(event: MatSlideToggleChange) {
		this.themeService.darkMode = !this.themeService.darkMode;
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

	/**
	 * Get an observable of events when the viewport reset button has been clicked.
	 */
	get onViewportReset(): Observable<void> {
		return this._onViewportResetSubject.asObservable();
	}

}
