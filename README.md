# Stockroom: Inventory App

A shop inventory app: add items, take stock in/out, get low-stock alerts,
track suppliers, and bulk-import from CSV, Excel, or Word. Built with
React + Vite, data stored in Firebase Firestore, deployed with Firebase
Hosting.

Each shop is its own "store" in the database. A shop owner creates the
store and gets a Store ID; staff sign up with their own account and join
using that ID. Every stock movement is attributed to the person who made
it.

## 1. Create your Firebase project

1. Go to https://console.firebase.google.com and click Add project.
2. Once created, click the </> (web) icon to register a web app. Skip
   the hosting setup wizard for now, and copy the `firebaseConfig` object
   it shows you.
3. Paste those values into `src/firebase.js`, replacing the placeholders
   (`YOUR_API_KEY`, `YOUR_PROJECT_ID`, etc).

## 2. Turn on the services this app uses

In the Firebase console, for your new project:

- Build, then Firestore Database, then Create database (start in
  production mode).
- Build, then Authentication, then Get started, then Sign-in method,
  then enable Email/Password.

## 3. Deploy your security rules

The rules in `firestore.rules` are what actually keep one shop's data
away from another shop, and staff accounts away from actions only the
owner should take (deleting items and suppliers). Deploy them with:

```
npm install -g firebase-tools    # if you don't have it yet
firebase login
firebase deploy --only firestore:rules
```

(You'll need `.firebaserc` pointed at your project first, see step 5.)

## 4. Install and run it locally (optional but recommended first)

```
npm install
npm run dev
```

This opens the app at `http://localhost:5173` talking to your real
Firebase project, so you can try it before deploying.

The first account to sign up on a fresh project should choose "Create a
shop." That becomes the store owner and gets a Store ID (shown under the
Team tab) to hand to staff. Everyone else signs up and chooses "Join
with Store ID."

## 5. Deploy to Firebase Hosting

Open `.firebaserc` and replace `YOUR-FIREBASE-PROJECT-ID` with your
actual Firebase project ID (find it in the console under Project
settings).

Then:

```
npm run build
firebase deploy
```

Firebase will print a URL like `https://your-project-id.web.app`, that's
your live app.

## Notes

- Accounts and roles: every user signs in with email and password. The
  person who creates a shop is its owner; everyone who joins with the
  Store ID is staff. Owners can delete items and suppliers; staff can add
  items, edit them, and record stock movements. Nobody can edit or delete
  a past activity log entry, it's an audit trail.
- Data model: each shop's items, suppliers, and transactions live in
  their own Firestore subcollections under `stores/{storeId}`, so the app
  isn't limited by Firestore's 1MB single-document size, and two people
  recording stock movements at the same time won't overwrite each other's
  change (stock quantities update with an atomic increment, not a
  read-then-overwrite).
- Offline: the app keeps a local cache of your data, so it stays usable
  (and queues writes) through a dropped connection, syncing once you're
  back online.
- Only the most recent 500 activity log entries are kept in the
  dashboard's live view; older history still exists in Firestore if you
  ever need to query it directly from the console.
- Re-deploying: after any code change, run `npm run build && firebase
  deploy` again. If you change `firestore.rules`, deploy those
  separately with `firebase deploy --only firestore:rules`.
