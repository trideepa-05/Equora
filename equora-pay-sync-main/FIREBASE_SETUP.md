# Firebase Integration Setup Guide

This guide will help you complete the Firebase integration for the Equora app.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter your project name (e.g., "Equora")
4. Follow the setup wizard
5. Once created, you'll see your project dashboard

## Step 2: Get Your Firebase Configuration

### For Web App:

1. In the Firebase console, click on **Settings** (⚙️) → **Project settings**
2. Scroll down to "Your apps" section
3. Click the **Web** icon (</>) if you haven't added a web app yet
4. Follow the app registration process (app nickname, hosting, etc.)
5. You'll see a configuration object like:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD...",
  authDomain: "equora-123abc.firebaseapp.com",
  projectId: "equora-123abc",
  storageBucket: "equora-123abc.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};
```

## Step 3: Configure Environment Variables

1. Open `.env.local` in the project root
2. Fill in your Firebase credentials:

```
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
```

## Step 4: Enable Authentication Methods

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable the following providers:
   - **Email/Password** - Click Enable
   - **Google** (Optional) - Click Enable
     - You'll need to set up a Google OAuth consent screen

### For Google Sign-In:

1. Go to **Authentication** → **Sign-in method**
2. Click **Google** → **Enable**
3. Select a support email and click **Save**
4. You may need to configure the OAuth consent screen:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Find your project
   - OAuth consent screen setup will guide you

## Step 5: Setup Firestore Database (Optional)

If you want to store user data and expenses in the cloud:

1. Go to **Firestore Database** in Firebase Console
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select a region close to you
5. Click **Create**

### Security Rules Example:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only allow authenticated users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Step 6: Test the Integration

1. Start the development server:

```bash
npm run dev
```

2. Navigate to `http://localhost:5173`
3. You should see the Splash screen → redirected to Login
4. Try creating an account or signing in with email/password
5. After successful login, you should be redirected to the Dashboard

## Project Structure

The Firebase integration includes:

- **`src/lib/firebase.ts`** - Firebase app initialization
- **`src/contexts/AuthContext.tsx`** - Authentication context with useAuth hook
- **`src/components/ProtectedRoute.tsx`** - Route protection for authenticated pages
- **`.env.local`** - Your Firebase credentials (keep this SECRET!)
- **`.env.example`** - Template for environment variables

## Next Steps

### Connect Firestore to Your App

The app currently uses mock data in `src/lib/appData.tsx`. To connect to Firestore:

1. Create a service file for Firestore operations:

```typescript
// src/services/firestoreService.ts
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Expense, Group } from "@/lib/types";

export const createExpense = async (expense: Expense) => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error("User not authenticated");
  
  return addDoc(collection(db, "expenses"), {
    ...expense,
    userId,
    createdAt: new Date(),
  });
};

export const getUserExpenses = async () => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error("User not authenticated");
  
  const q = query(
    collection(db, "expenses"),
    where("userId", "==", userId)
  );
  
  return getDocs(q);
};
```

2. Update your components to use these services instead of mock data

### Common Issues & Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid API Key" | Check that your `.env.local` has the correct values |
| Firebase not initialized | Make sure `.env.local` is loaded - restart dev server |
| TypeError: auth is undefined | Ensure AuthProvider wraps your app in App.tsx |
| CORS errors | Firebase should handle CORS automatically; check domain in settings |
| Google Sign-in not working | OAuth consent screen must be configured in Google Cloud Console |

## Security Checklist

- ✅ Never commit `.env.local` to Git (already in `.gitignore`)
- ✅ Use `.env.example` as a template for collaborators
- ✅ Enable Firestore security rules before production
- ✅ Use HTTPS in production
- ✅ Implement rate limiting for authentication attempts

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Firestore Database](https://firebase.google.com/docs/firestore)
- [React Firebase Hooks](https://github.com/CSFrequency/react-firebase-hooks) (Alternative to custom AuthContext)

---

**You're all set!** Your Equora app is now integrated with Firebase. 🎉
