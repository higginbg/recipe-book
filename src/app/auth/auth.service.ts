import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Router } from "@angular/router";
import { catchError, tap } from "rxjs/operators";
import { throwError, BehaviorSubject } from "rxjs";

import { User } from "./user.model";
import { environment } from "src/environments/environment";

export interface AuthResponseData {
  kind: string;
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  registered?: boolean;
}

@Injectable({ providedIn: "root" })
export class AuthService {
  user = new BehaviorSubject<User>(null);
  private tokenExpirationTimer: any;

  constructor(private http: HttpClient, private router: Router) {}

  signup(email: string, password: string) {
    const signupUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${environment.firebaseAPIKey}`;

    return this.http
      .post<AuthResponseData>(signupUrl, {
        email,
        password,
        returnSecureToken: true,
      })
      .pipe(
        catchError(this.handleError),
        tap((resData) => {
          const { email, localId, idToken, expiresIn } = resData;
          this.handleAuthentication(email, localId, idToken, +expiresIn);
        })
      );
  }

  login(email: string, password: string) {
    const loginUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${environment.firebaseAPIKey}`;

    return this.http
      .post<AuthResponseData>(loginUrl, {
        email,
        password,
        returnSecureToken: true,
      })
      .pipe(
        catchError(this.handleError),
        tap((resData) => {
          const { email, localId, idToken, expiresIn } = resData;
          this.handleAuthentication(email, localId, idToken, +expiresIn);
        })
      );
  }

  autoLogin() {
    const userData: {
      email: string;
      id: string;
      _token: string;
      _tokenExpirationDate: string;
    } = JSON.parse(localStorage.getItem("userData"));
    if (!userData) {
      return;
    }

    const { email, id, _token, _tokenExpirationDate } = userData;
    const loadedUser = new User(
      email,
      id,
      _token,
      new Date(_tokenExpirationDate)
    );

    if (loadedUser.token) {
      this.user.next(loadedUser);
      const expirationDuration =
        new Date(_tokenExpirationDate).getTime() - new Date().getTime();
      this.autoLogout(expirationDuration);
    }
  }

  logout() {
    this.user.next(null);
    this.router.navigate(["/auth"]);
    localStorage.removeItem("userData");
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
    }
    this.tokenExpirationTimer = null;
  }

  autoLogout(expirationDuration: number) {
    this.tokenExpirationTimer = setTimeout(() => {
      this.logout();
    }, expirationDuration);
  }

  private handleAuthentication(
    email: string,
    userId: string,
    token: string,
    expiresIn: number
  ) {
    const expirationDate = new Date(new Date().getTime() + +expiresIn * 1000);
    const user = new User(email, userId, token, expirationDate);
    this.user.next(user);
    this.autoLogout(expiresIn * 1000);
    localStorage.setItem("userData", JSON.stringify(user));
  }

  private handleError(errorRes: HttpErrorResponse) {
    let errorMessage = "An unknown error occured.";

    if (!errorRes.error || !errorRes.error.error) {
      return throwError(errorMessage);
    }

    switch (errorRes.error.error.message) {
      case "EMAIL_EXISTS":
        errorMessage = "Email already exits.";
        break;
      case "EMAIL_NOT_FOUND":
        errorMessage = "This email does not exist.";
        break;
      case "INVALID_PASSWORD":
        errorMessage = "Password incorrect.";
        break;
    }

    return throwError(errorMessage);
  }
}
