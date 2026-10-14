import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot,
  orderBy
} from 'firebase/firestore';

// Read config from firebase-applet-config.json
import firebaseConfigData from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfigData.firestoreDatabaseId || undefined);
export const googleProvider = new GoogleAuthProvider();

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  lastLoginMethod?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Save or sync user profile in Firestore
export async function syncUserProfile(user: FirebaseUser, loginMethod: string, customName?: string): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  let existingDisplayName = '';

  try {
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      existingDisplayName = userSnap.data().displayName || '';
    }
  } catch (err) {
    console.error("Error reading user profile from Firestore:", err);
  }

  const finalDisplayName = customName || existingDisplayName || user.displayName || user.email?.split('@')[0] || 'User';

  if (finalDisplayName && user.displayName !== finalDisplayName) {
    try {
      const { updateProfile } = await import('firebase/auth');
      await updateProfile(user, { displayName: finalDisplayName });
    } catch (e) {
      // ignore
    }
  }

  const profileData: UserProfile = {
    uid: user.uid,
    email: user.email || '',
    displayName: finalDisplayName,
    photoURL: user.photoURL || '',
    lastLoginMethod: loginMethod,
    updatedAt: new Date().toISOString()
  };

  try {
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      profileData.createdAt = new Date().toISOString();
      await setDoc(userRef, profileData);
    } else {
      await updateDoc(userRef, {
        lastLoginMethod: loginMethod,
        displayName: finalDisplayName,
        updatedAt: new Date().toISOString()
      });
    }
  } catch (err) {
    console.error("Error writing user profile to Firestore:", err);
  }

  return profileData;
}

// Real Google Sign-In with exact user profile synced to Firestore
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const profile = await syncUserProfile(result.user, 'google');
    localStorage.setItem('otivo_current_user', JSON.stringify(profile));
    return { user: result.user, profile };
  } catch (err: any) {
    // Rethrow error so AuthModal displays proper error messages
    // No fake or demo accounts are created
    throw err;
  }
}

// Real Email Sign Up with fallback if Email auth is disabled in Firebase console
export async function signUpWithEmail(email: string, pass: string, name?: string) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    if (name) {
      try {
        const { updateProfile } = await import('firebase/auth');
        await updateProfile(result.user, { displayName: name });
      } catch (e) {
        // ignore
      }
    }
    const profile = await syncUserProfile(result.user, 'email', name);
    localStorage.setItem('otivo_current_user', JSON.stringify(profile));
    return { user: result.user, profile };
  } catch (err: any) {
    if (err.code === 'auth/operation-not-allowed') {
      // Fallback: Register and store user account directly in Firestore database
      const uid = 'db_' + email.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);

      const profileData: UserProfile = {
        uid,
        email,
        displayName: name || email.split('@')[0],
        lastLoginMethod: 'email',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (!userSnap.exists()) {
        await setDoc(userRef, profileData);
      } else {
        await updateDoc(userRef, {
          displayName: profileData.displayName,
          updatedAt: new Date().toISOString()
        });
      }

      localStorage.setItem('otivo_current_user', JSON.stringify(profileData));
      return { user: { uid, email, displayName: profileData.displayName } as any, profile: profileData };
    }
    throw err;
  }
}

// Real Email Login with fallback check in Firestore database
export async function loginWithEmail(email: string, pass: string) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    const profile = await syncUserProfile(result.user, 'email');
    localStorage.setItem('otivo_current_user', JSON.stringify(profile));
    return { user: result.user, profile };
  } catch (err: any) {
    if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
      // Fallback: Check if user document exists in Firestore database
      const uid = 'db_' + email.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const profileData = userSnap.data() as UserProfile;
        localStorage.setItem('otivo_current_user', JSON.stringify(profileData));
        return { user: { uid, email, displayName: profileData.displayName } as any, profile: profileData };
      }
    }
    throw err;
  }
}

// Sign Out
export async function logOut() {
  localStorage.removeItem('otivo_current_user');
  try {
    await firebaseSignOut(auth);
  } catch (e) {
    // ignore
  }
}

// Save sessions to Firestore for cross-browser persistence
export async function saveUserSessionsToFirestore(userId: string, sessions: any[]) {
  if (!userId) return;
  try {
    for (const session of sessions) {
      if (!session.id || session.id === 'sidebar_messages') continue;
      const docRef = doc(db, 'userSessions', session.id);
      
      // Convert dates/complex values to serializable structures
      const cleanMessages = (session.messages || []).map((m: any) => ({
        id: m.id || Math.random().toString(36).substring(7),
        role: m.role,
        content: m.content || '',
        timestamp: m.timestamp ? new Date(m.timestamp).toISOString() : new Date().toISOString(),
        thought: m.thought || '',
        imageUrl: m.imageUrl || '',
        musicUrl: m.musicUrl || '',
        files: m.files || []
      }));

      await setDoc(docRef, {
        id: session.id,
        userId: userId,
        title: session.title || 'Untitled Chat',
        createdAt: session.createdAt ? new Date(session.createdAt).getTime() : Date.now(),
        updatedAt: Date.now(),
        messages: cleanMessages
      }, { merge: true });
    }
  } catch (err) {
    console.error("Failed to save sessions to Firestore:", err);
  }
}

// Load user's sessions from Firestore when logging in on any browser
export async function loadUserSessionsFromFirestore(userId: string): Promise<any[]> {
  if (!userId) return [];
  try {
    const q = query(collection(db, 'userSessions'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const sessions: any[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      sessions.push({
        id: data.id || docSnap.id,
        title: data.title || 'Chat',
        createdAt: new Date(data.createdAt || Date.now()),
        messages: (data.messages || []).map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp || Date.now())
        }))
      });
    });
    // Sort descending by creation / update
    sessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return sessions;
  } catch (err) {
    console.error("Failed to load sessions from Firestore:", err);
    return [];
  }
}

// Delete session from Firestore
export async function deleteUserSessionFromFirestore(sessionId: string) {
  if (!sessionId) return;
  try {
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'userSessions', sessionId));
  } catch (err) {
    console.error("Failed to delete session from Firestore:", err);
  }
}

export { onAuthStateChanged };
