import { Injectable } from '@angular/core';
import { User } from 'app/core/user/user.types';
import { BehaviorSubject, map, Observable, ReplaySubject, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserService {
    private _user = new BehaviorSubject<User | null>(null);

    set user(value: User | null) {
        this._user.next(value);
    }

    get user$(): Observable<User | null> {
        return this._user.asObservable();
    }

    // If you expose a sync getter, make it nullable too:
    get user(): User | null {
        return this._user.value;
    }
}
