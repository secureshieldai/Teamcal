import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { getFirebaseAuth } from '../config/firebase';

export type SocialProvider = 'google' | 'apple';

let googleConfigured = false;

function configureGoogle() {
  if (googleConfigured) return;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (!webClientId) {
    throw new Error('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not configured');
  }
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  if (Platform.OS === 'ios' && !iosClientId) {
    throw new Error('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID is not configured');
  }
  GoogleSignin.configure({ webClientId, iosClientId });
  googleConfigured = true;
}

async function firebaseTokenFromGoogle() {
  if (Platform.OS === 'web') {
    const auth = getFirebaseAuth();
    const result = await signInWithPopup(auth, new GoogleAuthProvider());
    return { auth, idToken: await result.user.getIdToken(true) };
  }

  configureGoogle();
  if (Platform.OS === 'android') await GoogleSignin.hasPlayServices();
  const response = await GoogleSignin.signIn();
  const idToken = response.data?.idToken;
  if (!idToken) throw new Error('Google did not return an ID token');

  const auth = getFirebaseAuth();
  const result = await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
  return { auth, idToken: await result.user.getIdToken(true) };
}

async function firebaseTokenFromApple() {
  if (Platform.OS !== 'ios' || !(await AppleAuthentication.isAvailableAsync())) {
    throw new Error('Sign in with Apple is only available on supported Apple devices');
  }

  const randomBytes = await Crypto.getRandomBytesAsync(32);
  const rawNonce = Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce
  );
  const appleCredential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });
  if (!appleCredential.identityToken) throw new Error('Apple did not return an identity token');

  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({
    idToken: appleCredential.identityToken,
    rawNonce,
  });
  const auth = getFirebaseAuth();
  const result = await signInWithCredential(auth, credential);
  return { auth, idToken: await result.user.getIdToken(true) };
}

export async function getFirebaseIdToken(provider: SocialProvider): Promise<string> {
  const result = provider === 'google'
    ? await firebaseTokenFromGoogle()
    : await firebaseTokenFromApple();

  try {
    return result.idToken;
  } finally {
    await signOut(result.auth);
  }
}
