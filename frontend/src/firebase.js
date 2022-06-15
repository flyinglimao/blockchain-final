import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyBmYfdn5o4I-NIy317MjpE08m5E6MJAm5w",
  authDomain: "blockchain-class-20489.firebaseapp.com",
  databaseURL: "https://blockchain-class-20489-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "blockchain-class-20489",
  storageBucket: "blockchain-class-20489.appspot.com",
  messagingSenderId: "804819596633",
  appId: "1:804819596633:web:24b2b1ae3c9fee304cc848"
};

export const firebaseApp = initializeApp(firebaseConfig);
