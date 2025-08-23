const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

// Generate VAPID keys
const vapidKeys = webpush.generateVAPIDKeys();

console.log('Generated VAPID Keys:');
console.log('==================');
console.log('Public Key:', vapidKeys.publicKey);
console.log('Private Key:', vapidKeys.privateKey);
console.log('');

// Create .env file content
const envContent = `# VAPID Keys for Push Notifications
VAPID_PUBLIC_KEY=${vapidKeys.publicKey}
VAPID_PRIVATE_KEY=${vapidKeys.privateKey}
VAPID_EMAIL=mailto:support@communitylibrary.com

# Add these to your existing .env file or create a new one
`;

// Write to a file
fs.writeFileSync(path.join(__dirname, 'vapid-keys.txt'), envContent);

console.log('VAPID keys have been saved to vapid-keys.txt');
console.log('Copy these keys to your .env files:');
console.log('- Backend: Add VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL');
console.log('- Frontend: Add REACT_APP_VAPID_PUBLIC_KEY');
console.log('');
console.log('Example usage in .env:');
console.log('Backend .env:');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log('VAPID_EMAIL=mailto:support@communitylibrary.com');
console.log('');
console.log('Frontend .env:');
console.log(`REACT_APP_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
