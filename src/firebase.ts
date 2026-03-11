import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyB6gmqRjqfsykr0Nw_Wpx1XhdxMlYQLlkk",
  authDomain: "deewy-47ec0.firebaseapp.com",
  databaseURL: "https://deewy-47ec0-default-rtdb.firebaseio.com",
  projectId: "deewy-47ec0",
  storageBucket: "deewy-47ec0.firebasestorage.app",
  messagingSenderId: "255289361616",
  appId: "1:255289361616:web:b0ab334c1070bc0baf0ad5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export default app;
