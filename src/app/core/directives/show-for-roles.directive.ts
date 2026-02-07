import { Directive, Input, OnDestroy, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { distinctUntilChanged, map, Subscription, tap } from 'rxjs';
import { UserService } from '../user/user.service';

@Directive({
  selector: '[appShowForRoles], [appShowForPermissions], [appShowForAccess]',
  standalone: true
})
export class ShowForPermissionsDirective implements OnInit, OnDestroy {

    @Input('appShowForRoles') roles: string[] = [];
    @Input('appShowForPermissions') permissions: string[] = [];
    @Input('appShowForPermissionsRoles') rolesForPermissions: string[] = [];
    @Input('appShowForAccess') access: { roles?: string[], permissions?: string[] } = {};
    
    private sub?: Subscription;

    constructor(
        private _userService: UserService,
        private viewContainerRef: ViewContainerRef,
        private templateRef: TemplateRef<any>
    ) {}

    ngOnInit(): void {
        this.sub = this._userService.user$.pipe(
            map((user) => {
                if (!user) return false;

                // Handle appShowForAccess (single input with both roles and permissions)
                if (this.access && (this.access.roles?.length || this.access.permissions?.length)) {
                    const checkRoles = this.access.roles?.length ? this.access.roles.includes(user.rol || '') : true;
                    const checkPermissions = this.access.permissions?.length 
                        ? this.access.permissions.some(p => (user.permissions || []).includes(p))
                        : true;
                    return checkRoles && checkPermissions;
                }

                // Handle separate inputs with rolesForPermissions
                if (this.permissions.length > 0 && this.rolesForPermissions.length > 0) {
                    const userPermissions = user.permissions || [];
                    const hasPermission = this.permissions.some(p => userPermissions.includes(p));
                    const hasRole = this.rolesForPermissions.includes(user.rol || '');
                    return hasPermission && hasRole;
                }

                // If both permissions and roles are provided, check both (AND logic)
                if (this.permissions.length > 0 && this.roles.length > 0) {
                    const userPermissions = user.permissions || [];
                    const hasPermission = this.permissions.some(p => userPermissions.includes(p));
                    const hasRole = this.roles.includes(user.rol || '');
                    return hasPermission && hasRole;
                }

                // Check permissions only if provided
                if (this.permissions.length > 0) {
                    const userPermissions = user.permissions || [];
                    return this.permissions.some(p => userPermissions.includes(p));
                }

                // Check roles only if provided
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
