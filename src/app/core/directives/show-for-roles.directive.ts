import { Directive, Input, OnDestroy, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { distinctUntilChanged, map, Subscription, tap } from 'rxjs';
import { UserService } from '../user/user.service';

@Directive({
  selector: '[appShowForRoles], [appShowForPermissions]',
  standalone: true
})
export class ShowForPermissionsDirective implements OnInit, OnDestroy {

    @Input('appShowForRoles') roles: string[] = [];
    @Input('appShowForPermissions') permissions: string[] = [];

    private sub?: Subscription;

    constructor(
        private _userService: UserService,
        private viewContainerRef: ViewContainerRef,
        private templateRef: TemplateRef<any>
    ) {}

    ngOnInit(): void {
        console.log(this.permissions);
        this.sub = this._userService.user$.pipe(
            map((user) => {
                if (!user) return false;

                // Check permissions first if provided
                if (this.permissions.length > 0) {
                    const userPermissions = user.permissions || [];
                    return this.permissions.some(p => userPermissions.includes(p));
                }

                // Fallback to roles
                if (this.roles.length > 0) {
                    return this.roles.includes(user.rol || '');
                }

                return false;
            }),
            distinctUntilChanged(),
            tap((hasAccess) =>
                hasAccess
                ? this.viewContainerRef.createEmbeddedView(this.templateRef)
                : this.viewContainerRef.clear())
        ).subscribe();
    }

    ngOnDestroy(): void {
        this.sub?.unsubscribe();
    }

}
