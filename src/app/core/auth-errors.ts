const messages: Record<string, string> = {
  'auth/invalid-credential': 'E-posta veya şifre hatalı.',
  'auth/invalid-email': 'E-posta adresi geçersiz.',
  'auth/user-not-found': 'Bu e-posta ile kayıtlı kullanıcı bulunamadı.',
  'auth/wrong-password': 'E-posta veya şifre hatalı.',
  'auth/email-already-in-use': 'Bu e-posta adresi zaten kullanılıyor.',
  'auth/weak-password': 'Şifre en az 6 karakter olmalıdır.',
  'auth/too-many-requests': 'Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar deneyin.',
  'auth/network-request-failed': 'Ağ bağlantısı kurulamadı. İnternet bağlantınızı kontrol edin.',
  'auth/user-disabled': 'Bu hesap devre dışı bırakılmış.',
  'auth/popup-closed-by-user': 'Google giriş penceresi kapatıldı. Girişi tekrar deneyin.',
  'auth/popup-blocked': 'Tarayıcı Google giriş penceresini engelledi. Pop-up engelleyicisini kapatıp tekrar deneyin.',
  'auth/cancelled-popup-request': 'Google giriş penceresi açılamadı. Pop-up engelleyicisini kapatıp tekrar deneyin.',
  'auth/unauthorized-domain':
    'Bu alan adı Firebase Authentication → Settings → Authorized domains listesinde yok. ' +
    'tahakkuk.web.app adresini ekleyin.',
  'auth/operation-not-allowed':
    'Google ile giriş Firebase Authentication → Sign-in method altında etkin değil.',
};

export function toAuthErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message === 'FIREBASE_NOT_CONFIGURED') {
    return 'Firebase yapılandırması eksik. Lütfen .env dosyanızı oluşturun.';
  }

  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';

  return messages[code] ?? 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.';
}
