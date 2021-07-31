import * as firebase from 'firebase';
require('@firebase/firestore');
// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyCPmlGqA8sW58KxWma_lcyxJDyj8pyR9kg",
    authDomain: "wily-app-5f39a.firebaseapp.com",
    projectId: "wily-app-5f39a",
    storageBucket: "wily-app-5f39a.appspot.com",
    messagingSenderId: "873007451083",
    appId: "1:873007451083:web:8acefbd45b8ef477db844e"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

export default firebase.firestore();