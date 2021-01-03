import firebase from 'firebase/app'
import 'firebase/auth'
import "firebase/firestore"

const app = firebase.initializeApp({
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREABASE_AUTH_DOMAIN,
    databaseURL: process.env.REACT_APP_FIREABASE_DATABASE_URL,
    projectId: process.env.REACT_APP_FIREABASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREABASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREABASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREABASE_APP_ID,
    measurementId: "G-ZLEHXQGB5X"
})

export const auth = app.auth()

export default app