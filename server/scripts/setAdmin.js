import admin from '../config/firebaseAdmin.js';

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/setAdmin.js <email>');
  process.exit(1);
}
const user = await admin.auth().getUserByEmail(email);
await admin.auth().setCustomUserClaims(user.uid, { admin: true });
console.log(`${email} (${user.uid}) is now an admin.`);
console.log('Sign out and back in on the client for the new claim to take effect.');
process.exit(0);