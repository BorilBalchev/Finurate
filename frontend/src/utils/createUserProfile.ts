import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { auth } from '../firebase';

const db = getFirestore();

export const createUserProfile = async (user: any) => {
  if (!user) return;

  const userRef = doc(db, 'users', user.uid);

  await setDoc(userRef, {
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    createdAt: new Date(),
  }, { merge: true });
};
