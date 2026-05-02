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

app.firestore().enablePersistence({ synchronizeTabs: true })
  .catch((err) => {
    if (err.code === "failed-precondition") {
      console.warn("Firestore persistence: multi-tab synchronization unavailable in this browser; running without offline cache.")
    } else if (err.code === "unimplemented") {
      console.warn("Firestore persistence: browser does not support IndexedDB; running without offline cache.")
    } else {
      console.warn("Firestore persistence failed:", err)
    }
  })

export const auth = app.auth()

export default app