import app from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';
/*
const config = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_DATABASE_URL,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
};
*/
/*
const config = {
  apiKey: "AIzaSyA5CIzoNQCPAUmJsaxQWu_YfgFBYTK_ha0",
  authDomain: "admin-web-fcb56.firebaseapp.com",
  databaseURL: "https://admin-web-fcb56.firebaseio.com",
  projectId: "admin-web-fcb56",
  storageBucket: "admin-web-fcb56.appspot.com",
  messagingSenderId: "1087616861138",
  appId: "1:1087616861138:web:55e9a6f2e15607c4cc7e0b",
  measurementId: "G-QW98HE447B"
};
*/

const firebaseConfig = {
  apiKey: "AIzaSyB0QIE5ovq7wBk2mGpJOWV_dhwktC7otWY",
  authDomain: "qr-evt-db.firebaseapp.com",
  databaseURL: "https://qr-evt-db.firebaseio.com",
  projectId: "qr-evt-db",
  storageBucket: "qr-evt-db.appspot.com",
  messagingSenderId: "674043381322",
  appId: "1:674043381322:web:3e0c01efac7894d3b988b3",
  measurementId: "G-48F08239KK"
};

class Firebase {
  constructor() {
    app.initializeApp(firebaseConfig);

    this.auth = app.auth();
    this.db = app.database();
  }

  // *** Auth API ***

  doCreateUserWithEmailAndPassword = (email, password) =>
    this.auth.createUserWithEmailAndPassword(email, password);

  doSignInWithEmailAndPassword = (email, password) =>
    this.auth.signInWithEmailAndPassword(email, password);

  doSignOut = () => this.auth.signOut();

  doPasswordReset = email => this.auth.sendPasswordResetEmail(email);

  doPasswordUpdate = password =>
    this.auth.currentUser.updatePassword(password);

  // *** User API ***

  user = uid => this.db.ref(`users/${uid}`);

  users = () => this.db.ref('users');
}

export default Firebase;