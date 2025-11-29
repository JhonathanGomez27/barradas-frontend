import { Directive, Input, OnDestroy, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { distinctUntilChanged, map, Subscription, tap } from 'rxjs';
import { UserService } from '../user/user.service';

@Directive({
  selector: '[appShowForRoles]',
  standalone: true
})
export class ShowForRolesDirective implements OnInit, OnDestroy {

    @Input('appShowForRoles') roles: string[] = [];
    private sub?: Subscription;

    constructor(
        private _userService: UserService,
        private viewContainerRef: ViewContainerRef,
        private templateRef: TemplateRef<any>
    ) {}

    ngOnInit(): void {
        this.sub = this._userService.user$.pipe(
            map((user) => Boolean(user && this.roles.includes(user.rol))),
            distinctUntilChanged(),
            tap((hasRole) =>
                hasRole
                ? this.viewContainerRef.createEmbeddedView(this.templateRef)
                : this.viewContainerRef.clear())
        ).subscribe();
    }

    ngOnDestroy(): void {
        this.sub?.unsubscribe();
    }

}
