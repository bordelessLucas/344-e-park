import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';
import { logout } from '../services/authService';
import type { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigateToLogin(): void {
  const reset = () => {
    navigationRef.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      })
    );
  };

  if (navigationRef.isReady()) {
    reset();
    return;
  }

  const tryLater = (delayMs: number) => {
    setTimeout(() => {
      if (navigationRef.isReady()) {
        reset();
      } else if (delayMs < 400) {
        tryLater(delayMs * 2);
      }
    }, delayMs);
  };
  tryLater(16);
}

/** Firebase signOut + reset da pilha para Login (use nos dois botões de sair: drawer e perfil). */
export async function signOutAndGoToLogin(): Promise<void> {
  await logout();
  navigateToLogin();
}
