import { RippleGlobalOptions } from '@angular/material/core';
import { MatSnackBarConfig } from '@angular/material/snack-bar';

export const RIPPLE_CONFIG: RippleGlobalOptions = {
  disabled: false,
  animation: {
    enterDuration: 100,
    exitDuration: 200,
  },
};

export const SNACK_BAR_CONFIG: MatSnackBarConfig = {
  duration: 2000,
  horizontalPosition: 'left',
  verticalPosition: 'bottom',
  panelClass: ['ts-snack-bar'],
};
