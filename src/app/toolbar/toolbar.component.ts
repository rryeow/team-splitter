import { Component, HostBinding, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { combineLatest, Observable, Subject } from 'rxjs';
import { map, takeUntil, withLatestFrom } from 'rxjs/operators';
import { AppLayout, Theme } from '../shared/interfaces';
import { LabelsService } from "../shared/labels.service";
import { LayoutService } from '../shared/layout.service';
import { SNACK_BAR_CONFIG } from '../shared/material-config';
import { PlayersService } from '../shared/players.service';
import { ThemeService } from '../shared/theme.service';

const THEME_ICONS: { [theme in Theme]: string } = {
  dark: 'dark_mode',
  light: 'light_mode',
};

interface ToolbarInfo {
  nextTheme: Theme;
  isCollapsed: boolean;
}

@Component({
  selector: 'ts-toolbar',
  templateUrl: './toolbar.component.html',
})
export class ToolbarComponent implements OnDestroy {
  @HostBinding('class.toolbar') toolbarClass = true;
  toolbarInfo$: Observable<ToolbarInfo>;
  copyTeams$ = new Subject();
  unsubscribeNotifier$ = new Subject();

  constructor(
    private playersService: PlayersService,
    private labelsService: LabelsService,
    private layoutService: LayoutService,
    private themeService: ThemeService,
    private snackBarService: MatSnackBar,
  ) {
    this.toolbarInfo$ = combineLatest([
      this.themeService.nextTheme$,
      this.layoutService.isSingleColumnLayout$,
    ])
      .pipe(
        map(([nextTheme, isSingleColumnLayout]) => ({ nextTheme, isCollapsed: isSingleColumnLayout })),
      );

    this.copyTeams$
      .pipe(
        withLatestFrom(this.layoutService.layout$),
        map(([_, layout]) => layout),
        takeUntil(this.unsubscribeNotifier$),
      )
      .subscribe(layout => {
        this.playersService.copyTeamsToClipboard(isCopySuccess => {
          this.notifyCopySuccess(layout, isCopySuccess);
        });
      });
  }

  ngOnDestroy(): void {
    this.unsubscribeNotifier$.next();
    this.unsubscribeNotifier$.complete();
  }

  randomizeTeams(): void {
    this.playersService.shuffleTeams();
  }

  randomizePlayers(): void {
    this.playersService.randomizePlayers();
  }

  copyTeamsToClipboard(): void {
    this.copyTeams$.next();
  }

  resetApp(): void {
    this.playersService.clearPool();
    this.playersService.resetTeams();
    this.labelsService.resetLabels();
  }

  getToggleThemeIcon(nextTheme: Theme): string {
    return THEME_ICONS[nextTheme];
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  private notifyCopySuccess(appLayout: AppLayout, isCopySuccess: boolean): void {
    const snackBarMessage = isCopySuccess
      ? 'Copied teams to clipboard!'
      : 'Copy failed';
    let snackBarConfig = SNACK_BAR_CONFIG;
    if (appLayout !== 'wide') {
      snackBarConfig = {
        ...SNACK_BAR_CONFIG,
        panelClass: [...SNACK_BAR_CONFIG.panelClass || [], 'ts-snack-bar--footer-offset'],
      }
    }
    this.snackBarService.open(snackBarMessage, undefined, snackBarConfig);
  }
}
