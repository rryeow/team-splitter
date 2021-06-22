import { Component, HostBinding } from '@angular/core';
import { PlayersService } from '../shared/players.service';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CdkDragDrop, DragAxis, DropListOrientation } from '@angular/cdk/drag-drop';
import { LayoutService } from '../shared/layout.service';
import { Team } from '../shared/interfaces';
import { TEAMS_ID } from '../shared/constants';

interface OrientationInfo {
  dropListOrientation: DropListOrientation;
  lockAxis: DragAxis;
}
interface TeamsAndOrientation extends OrientationInfo {
  teams: Team[];
}

@Component({
  selector: 'ts-teams',
  templateUrl: './teams.component.html',
})
export class TeamsComponent {
  @HostBinding('class.teams') teamsClass = true;
  id = TEAMS_ID;
  teamsInfo$: Observable<TeamsAndOrientation>;

  constructor(
    private layoutService: LayoutService,
    private playersService: PlayersService,
  ) {
    const orientationInfo$: Observable<OrientationInfo> = this.layoutService.isSingleColumnLayout$
      .pipe(
        map(isSingleColumnLayout => isSingleColumnLayout
          ? { dropListOrientation: 'vertical', lockAxis: 'y' }
          : { dropListOrientation: 'horizontal', lockAxis: 'x' }
        ),
      );
    this.teamsInfo$ = combineLatest([
      this.playersService.teams$,
      orientationInfo$,
    ])
      .pipe(
        map(([teams, orientationInfo]) => ({ teams, ...orientationInfo })),
      );
  }

  trackById(_: number, team: Team): string {
    return team.id;
  }

  drop(event: CdkDragDrop<Team[], Team[]>): void {
    if (event.previousIndex !== event.currentIndex) {
      this.playersService.moveTeam(event);
    }
  }

  addTeam(dropListOrientation: DropListOrientation, dropList: HTMLDivElement): void {
    this.playersService.addTeam({}, true);
    setTimeout(() => {
      if (dropListOrientation === 'vertical') {
        dropList.scrollTop = dropList.scrollHeight;
      } else {
        dropList.scrollLeft = dropList.scrollWidth;
      }
    }, 0);
  }
}
