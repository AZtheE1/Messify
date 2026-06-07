# Messify

Premium Hostel Expense & Meal Management PWA.

## Setup Instructions

1. **Firebase Configuration**
   Open `js/app.js` and locate the `firebaseConfig` block.
   Replace the placeholder values with your actual Firebase project settings:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT.appspot.com",
     messagingSenderId: "YOUR_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

2. **First-Admin Setup**
   The application uses Firebase Authentication (Google Sign-In). 
   - Ensure you have enabled Google Sign-In as an authentication method in your Firebase console.
   - The very first user to log in when the database `members` collection is empty will automatically be granted the `admin` role. 
   - Subsequent sign-ins will create users with the `member` role by default, unless an admin changes their role in the Admin panel.

3. **Database Security Rules**
   Deploy the `firestore.rules` to your Firebase project to secure your database:
   ```bash
   firebase deploy --only firestore:rules
   ```

4. **Deployment to GitHub Pages**
   Because this is a pure HTML5/CSS3/Vanilla JS app with no build step, you can deploy it directly:
   - Create a new GitHub repository.
   - Push the contents of the `messify` folder to the repository.
   - Go to the repository settings -> Pages.
   - Select the main branch as the source and save.
   - The site will be published at your `github.io` URL.

Enjoy using Messify!
