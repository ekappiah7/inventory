# Stockroom: Inventory App

A shop inventory app: add items, take stock in/out, get low-stock alerts,
track suppliers, bulk-import from CSV, Excel, or Word, and see profit
and loss, top sellers, and slow-moving stock in the Reports tab. Built
with React + Vite, data stored in Firebase Firestore, deployed with
Firebase Hosting.

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
shop." That becomes the store owner and gets an invite code (shown under
the Team tab) to hand to staff. Everyone else signs up and chooses "Join
with a code."

Before pushing changes, run the checks:

```
npm run check
```

That runs ESLint and the test suite. `npm run ship` runs both before it
builds and deploys, so a lint error or failing test stops a bad deploy
rather than shipping it.

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
- How item cost is worked out: each item carries a weighted average cost
  of the stock actually on hand. When you record a delivery ("Stock in"
  with reason "Purchased from supplier") you enter what you paid per
  unit, and that blends into the average by quantity. Buy 10 bags at 38
  when you already hold 10 at 38, then 10 more at 45, and the average
  becomes 41.50, so profit reflects what the goods really cost rather
  than whatever was last typed into the cost price field. Selling does
  not change the average. The "Cost price" field is just the price you
  expect to pay, used as the default when receiving stock. You can
  correct an item's average by hand when editing it, which is what you
  want when entering stock bought before you started using the app.
- Reports and stock-out reasons: every stock-out asks for a reason
  (Sold to customer, Damaged/expired/lost, or Other adjustment). Only
  the ones marked "Sold to customer" count toward revenue and profit in
  the Reports tab, so recording that accurately is what makes the P&L
  numbers meaningful. Cost and sell price are captured on the
  transaction at the moment it happens, so editing an item's price later
  doesn't change past reports.
- New shops start empty: there's no more sample/demo stock seeded in
  automatically. The Team tab also has an owner-only "Clear all shop
  data" reset if you want to wipe a shop back to nothing.
- Invite codes: staff join with an 8-character code rather than the raw
  Store ID, and the owner can generate a new one at any time from the
  Team tab. Generating a new code immediately stops the old one working,
  which is how you cut off a code that leaked. Removing someone from the
  Team tab revokes their access straight away.
- Reports read their own slice of history (up to 5,000 movements for the
  chosen period) rather than the dashboard's live 500-entry feed, so the
  profit figures stay correct as the shop's history grows.
- Backups: nothing is backed up automatically. The Team tab has a
  "Download backup" button that saves the whole shop (items, suppliers,
  full movement history) as one JSON file. Take one regularly. If you
  later move the project to Firebase's Blaze plan, you can schedule
  proper server-side exports with
  `gcloud firestore export gs://your-bucket` on a Cloud Scheduler job.
