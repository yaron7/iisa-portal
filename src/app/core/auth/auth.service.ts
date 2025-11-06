import { Injectable, inject } from '@angular/core';
import {
  Auth,
  User,
  signInWithEmailAndPassword,
  signOut,
  user,
  createUserWithEmailAndPassword,
} from '@angular/fire/auth';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth: Auth = inject(Auth); // Inject Firebase Auth service
  currentUser$: Observable<User | null> = user(this.auth); // Observable for the current user

  constructor() {}

  /**
   * Logs in a user with email and password.
   * @param email The user's email.
   * @param password The user's password.
   * @returns An Observable that resolves when the user is logged in, or rejects on error.
   */
  login(email: string, password: string): Observable<any> {
    return from(signInWithEmailAndPassword(this.auth, email, password));
  }

  /**
   * Creates a new user with email and password (for admin registration, if needed).
   * @param email The new user's email.
   * @param password The new user's password.
   * @returns An Observable that resolves when the user is created, or rejects on error.
   */
  register(email: string, password: string): Observable<any> {
    return from(createUserWithEmailAndPassword(this.auth, email, password));
  }

  /**
   * Logs out the current user.
   * @returns An Observable that resolves when the user is logged out, or rejects on error.
   */
  logout(): Observable<void> {
    return from(signOut(this.auth));
  }

  /**
   * Checks if the user is currently logged in.
   * @returns An Observable boolean.
   */
  isLoggedIn(): Observable<boolean> {
    return this.currentUser$.pipe(
      map((user) => !!user) // Map user object to boolean (true if user exists, false otherwise)
    );
  }

  /**
   * Gets the UID of the current user.
   * @returns An Observable of the user's UID or null.
   */
  getCurrentUserUid(): Observable<string | null> {
    return this.currentUser$.pipe(map((user) => (user ? user.uid : null)));
  }
}
