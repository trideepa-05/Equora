/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  AuthError,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<User>;
  signIn: (email: string, password: string) => Promise<User>;
  signInWithGoogle: () => Promise<User>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getAuthErrorMessage = (error: unknown, action: "signup" | "signin" | "google" | "logout") => {
  const code = (error as AuthError | undefined)?.code;
  if (!code) {
    if (error instanceof Error) return error.message;
    return "Something went wrong. Please try again.";
  }

  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-not-found":
      return "No account found for this email.";
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password.";
    case "auth/email-already-in-use":
      return "This email is already in use. Please sign in instead.";
    case "auth/weak-password":
      return "Password is too weak. Use at least 6 characters.";
    case "auth/popup-closed-by-user":
      return "Google sign-in was canceled before completion.";
    case "auth/popup-blocked":
      return "Popup was blocked by the browser. Please allow popups and try again.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection.";
    default:
      if (action === "signup") return "Failed to create account.";
      if (action === "signin") return "Failed to sign in.";
      if (action === "google") return "Failed to sign in with Google.";
      return "Failed to sign out.";
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const syncUserProfile = useCallback(async (authUser: User) => {
    if (!db || !authUser.email) return;
    try {
      await setDoc(
        doc(db, "users", authUser.uid),
        {
          name: authUser.displayName || authUser.email.split("@")[0],
          email: authUser.email,
          preferredCurrency: "USD",
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (syncError) {
      console.error("Failed to sync user profile:", syncError);
    }
  }, []);

  // Check auth state on mount
  useEffect(() => {
    if (!auth || !isFirebaseConfigured) {
      setIsLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        void syncUserProfile(currentUser);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, [syncUserProfile]);

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      try {
        setError(null);
        if (!auth || !isFirebaseConfigured) {
          const mockUser = { uid: `local-${Date.now()}`, email, displayName } as User;
          setUser(mockUser);
          return mockUser;
        }
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        // Update profile with display name
        await updateProfile(userCredential.user, { displayName });
        await syncUserProfile(userCredential.user);

        return userCredential.user;
      } catch (err: unknown) {
        const errorMessage = getAuthErrorMessage(err, "signup");
        setError(errorMessage);
        throw err;
      }
    },
    [syncUserProfile]
  );

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      if (!auth || !isFirebaseConfigured) {
        const mockUser = { uid: "local-user", email, displayName: email.split("@")[0] } as User;
        setUser(mockUser);
        return mockUser;
      }
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      await syncUserProfile(userCredential.user);
      return userCredential.user;
    } catch (err: unknown) {
      const errorMessage = getAuthErrorMessage(err, "signin");
      setError(errorMessage);
      throw err;
    }
  }, [syncUserProfile]);

  const signInWithGoogle = useCallback(async () => {
    try {
      setError(null);
      if (!auth || !isFirebaseConfigured) {
        const mockUser = { uid: "local-google", email: "demo@equora.io", displayName: "Demo User" } as User;
        setUser(mockUser);
        return mockUser;
      }
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      await syncUserProfile(userCredential.user);
      return userCredential.user;
    } catch (err: unknown) {
      const errorMessage = getAuthErrorMessage(err, "google");
      setError(errorMessage);
      throw err;
    }
  }, [syncUserProfile]);

  const logout = useCallback(async () => {
    try {
      setError(null);
      if (!auth || !isFirebaseConfigured) {
        setUser(null);
        return;
      }
      await signOut(auth);
      setUser(null);
    } catch (err: unknown) {
      const errorMessage = getAuthErrorMessage(err, "logout");
      setError(errorMessage);
      throw err;
    }
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
