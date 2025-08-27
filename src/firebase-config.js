  import firebase from 'firebase/compat/app';
  import 'firebase/compat/auth';
  import 'firebase/compat/firestore';
  import 'firebase/compat/storage';

  const firebaseConfig = {
      apiKey: "AIzaSyDKhuXFIZguNHC5a5-ZwI-nasKIrSgXNLM",
      authDomain: "visit-scheduling-system.firebaseapp.com",
      projectId: "visit-scheduling-system",
      storageBucket: "visit-scheduling-system.firebasestorage.app",
      messagingSenderId: "600268449834",
      appId: "1:600268449834:web:edf3ec0b6f49bb8d337b53",
      measurementId: "G-T5D3R66LFX"
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  const auth = firebase.auth();
  const db = firebase.firestore();
  const storage = firebase.storage();

  const collections = {
      users: 'users',
      inmates: 'inmates',
      visitRequests: 'visitRequests',
      notifications: 'notifications',
      visitLogs: 'visitLogs',
      systemSettings: 'systemSettings'
  };

  export { firebaseConfig, firebase, auth, db, storage, collections }; 