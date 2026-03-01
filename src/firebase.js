import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyDdDzznjqS7VUxo7lb3-4MARLj-DVrx_14",
    authDomain: "expensetrackerparth.firebaseapp.com",
    projectId: "expensetrackerparth",
    storageBucket: "expensetrackerparth.firebasestorage.app",
    messagingSenderId: "395318271919",
    appId: "1:395318271919:web:bab1b689cb9c6e2a6fd95a",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
