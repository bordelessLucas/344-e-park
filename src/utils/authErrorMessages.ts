/**
 * Extrai o código auth/... do erro do Firebase (instanceof costuma falhar com várias cópias do pacote no bundle).
 */
function getFirebaseAuthCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const e = error as { code?: string; message?: string };
  if (typeof e.code === 'string' && e.code.startsWith('auth/')) {
    return e.code;
  }
  if (typeof e.message === 'string') {
    const fromParen = e.message.match(/\(auth\/[^)]+\)/);
    if (fromParen) {
      return fromParen[0].slice(1, -1);
    }
    const loose = e.message.match(/auth\/[\w-]+/);
    if (loose) return loose[0];
  }
  return undefined;
}

/**
 * Mensagens em português para erros de login do Firebase Auth.
 */
export function getAuthLoginErrorMessage(error: unknown): string {
  const code = getFirebaseAuthCode(error);
  if (code) {
    switch (code) {
      case 'auth/invalid-email':
        return 'O e-mail informado não é válido.';
      case 'auth/missing-email':
        return 'Informe seu e-mail.';
      case 'auth/missing-password':
        return 'Informe sua senha.';
      case 'auth/user-disabled':
        return 'Esta conta foi desabilitada. Entre em contato com o suporte.';
      case 'auth/user-not-found':
        return 'Não encontramos uma conta com este e-mail. Verifique o endereço ou crie uma conta.';
      case 'auth/wrong-password':
        return 'Senha incorreta. Verifique e tente novamente.';
      case 'auth/invalid-credential':
      case 'auth/invalid-login-credentials':
        return 'E-mail ou senha incorretos. Verifique os dados e tente novamente.';
      case 'auth/too-many-requests':
        return 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.';
      case 'auth/network-request-failed':
        return 'Sem conexão com a internet. Verifique sua rede e tente novamente.';
      case 'auth/operation-not-allowed':
        return 'Login por e-mail e senha não está habilitado para este projeto.';
      default:
        break;
    }
  }

  return 'Não foi possível entrar. Tente novamente.';
}

export function getPasswordResetErrorMessage(error: unknown): string {
  const code = getFirebaseAuthCode(error);
  if (code) {
    switch (code) {
      case 'auth/invalid-email':
        return 'O e-mail informado não é válido.';
      case 'auth/missing-email':
        return 'Informe seu e-mail.';
      case 'auth/user-not-found':
        return 'Não encontramos uma conta com este e-mail.';
      case 'auth/too-many-requests':
        return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
      case 'auth/network-request-failed':
        return 'Sem conexão com a internet. Verifique sua rede.';
      default:
        break;
    }
  }
  return 'Não foi possível enviar o e-mail de recuperação. Tente novamente.';
}

export function getChangePasswordErrorMessage(error: unknown): string {
  const code = getFirebaseAuthCode(error);
  if (code) {
    switch (code) {
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Senha atual incorreta.';
      case 'auth/weak-password':
        return 'A nova senha é muito fraca. Use pelo menos 6 caracteres.';
      case 'auth/requires-recent-login':
        return 'Por segurança, faça login novamente e tente alterar a senha.';
      case 'auth/network-request-failed':
        return 'Sem conexão com a internet.';
      default:
        break;
    }
  }
  if (typeof error === 'object' && error !== null && (error as Error).message === 'auth/no-email') {
    return 'Conta sem e-mail vinculado. Não é possível alterar a senha por aqui.';
  }
  return 'Não foi possível alterar a senha. Tente novamente.';
}
