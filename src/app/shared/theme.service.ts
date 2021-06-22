import { MediaMatcher } from '@angular/cdk/layout';
import {DOCUMENT} from "@angular/common";
import {Inject, Injectable} from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Theme } from './interfaces';

const THEME_KEY = 'theme';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // tslint:disable-next-line:variable-name
  private _theme: BehaviorSubject<Theme>;

  get theme$(): Observable<Theme> {
    return this._theme.asObservable();
  }

  get nextTheme$(): Observable<Theme> {
    return this.theme$.pipe(map(getNextTheme));
  }

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private mediaMatcher: MediaMatcher,
  ) {
    const storedTheme = localStorage.getItem(THEME_KEY);
    const prefersDarkTheme = this.mediaMatcher.matchMedia('(prefers-color-scheme: dark)').matches;
    const defaultTheme = prefersDarkTheme ? 'dark' : 'light';
    const initialTheme = storedTheme && isValidTheme(storedTheme) ? storedTheme : defaultTheme;
    this._theme = new BehaviorSubject(initialTheme);
    this.document.documentElement.setAttribute('data-theme', initialTheme);
  }

  toggleTheme(): void {
    const currTheme = this._theme.value;
    const nextTheme = getNextTheme(currTheme);
    this._theme.next(nextTheme);
    this.document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem(THEME_KEY, nextTheme);
  }
}

function isValidTheme(theme: string): theme is Theme {
  return theme === 'light' || theme === 'dark';
}

function getNextTheme(theme: Theme): Theme {
  return theme === 'dark' ? 'light' : 'dark';
}
