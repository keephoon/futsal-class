import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyA7Q0z9DOeXZ5KiL4BFs9RF_dtga2LtDXU",
  authDomain: "futsal-class.firebaseapp.com",
  projectId: "futsal-class",
  storageBucket: "futsal-class.firebasestorage.app",
  messagingSenderId: "574696235456",
  appId: "1:574696235456:web:750d7132a3eca31fe8a825",
  measurementId: "G-0GN4DDV44M"
}

const app = initializeApp(firebaseConfig)
export const analytics = getAnalytics(app)
export const db = getFirestore(app)
export { collection, addDoc, serverTimestamp }