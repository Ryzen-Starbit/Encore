import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  const keyPath = path.join(__dirname, '..', 'serviceAccountKey.json');
  if (!fs.existsSync(keyPath)) {
    throw new Error(
      `serviceAccountKey.json not found at ${keyPath}. Download it from ` +
        'Firebase Console > Project Settings > Service Accounts > Generate new private key, ' +
        'and save it there.'
    );
  }
  serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));
}
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
export const db = admin.firestore();
export const auth = admin.auth();
export default admin;