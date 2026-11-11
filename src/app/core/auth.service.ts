import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from './firebase';

export type AuthMode = 'login' | 'register';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly currentUser = signal<User | null>(null);
  private readonly stateReady = signal(false);
  private resolveState: ((user: User | null) => void) | null = null;
  private readonly statePromise = new Promise<User | null>((resolve) => {
    this.resolveState = resolve;
  });

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isConfigured = auth !== null;

  constructor() {
    if (!auth) {
      this.stateReady.set(true);
      this.resolveState?.(null);
      return;
    }

    onAuthStateChanged(auth, (user) => {
      this.currentUser.set(user);
      this.stateReady.set(true);
      this.resolveState?.(user);
      this.resolveState = null;
    });
  }

  async waitForAuthState(): Promise<User | null> {
    if (this.stateReady()) {
      return this.currentUser();
    }
    return this.statePromise;
  }

  async login(email: string, password: string): Promise<void> {
    const client = this.requireAuth();
    await signInWithEmailAndPassword(client, email, password);
  }

  async register(email: string, password: string, displayName: string): Promise<void> {
    const client = this.requireAuth();
    const credential = await createUserWithEmailAndPassword(client, email, password);
    if (displayName) {
      await updateProfile(credential.user, { displayName });
    }
  }

  async logout(): Promise<void> {
    const client = this.requireAuth();
    await signOut(client);
    await this.router.navigate(['/login']);
  }

  async updateDisplayName(displayName: string): Promise<void> {
    const user = this.currentUser();
    if (!user) {
      return;
    }
    await updateProfile(user, { displayName });
    this.currentUser.set({ ...user, displayName } as User);
  }

  private requireAuth() {
    if (!auth) {
      throw new Error('FIREBASE_NOT_CONFIGURED');
    }
    return auth;
  }
}
