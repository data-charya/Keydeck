# Encrypted Connection Profiles

This Redis GUI now includes **Encrypted Connection Profiles** - a secure, offline-capable way to store your Redis connection credentials locally with client-side encryption.

## 🔐 Security Features

- **AES-256-GCM Encryption**: Industry-standard encryption for maximum security
- **Client-Side Only**: All encryption/decryption happens in your browser
- **Passphrase Protected**: Your passphrase is never stored - required on every reload
- **IndexedDB Storage**: Secure, offline-capable storage that works without internet
- **Zero Server Storage**: Your credentials never leave your device

## 🚀 How It Works

1. **Create a Profile**: Set up your Redis connection and create a strong passphrase
2. **Local Encryption**: Your credentials are encrypted with AES-256-GCM using your passphrase
3. **IndexedDB Storage**: Encrypted data is stored locally in your browser's IndexedDB
4. **Passphrase Required**: Every time you reload the app, you need to enter your passphrase
5. **Instant Access**: Once unlocked, connect to any saved profile with one click

## 💡 Key Benefits

- **Feels Secure**: Your credentials are encrypted with a passphrase you control
- **Works Offline**: No internet required to access your saved connections
- **Respects Privacy**: Nothing is sent to external servers
- **Cross-Session**: Profiles persist between browser sessions
- **Easy Management**: Create, edit, delete, and organize your connection profiles

## 🛡️ Security Details

### Encryption Algorithm
- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Derivation**: PBKDF2 with SHA-256, 100,000 iterations
- **Salt**: 256-bit random salt per profile
- **IV**: 96-bit random initialization vector per encryption

### Passphrase Requirements
- Minimum 8 characters
- Must contain uppercase and lowercase letters
- Must contain at least one number
- Must contain at least one special character
- Cannot contain common weak patterns

### Storage Security
- **IndexedDB**: Browser's secure local database
- **No Network**: Data never leaves your device
- **Encrypted at Rest**: All data is encrypted before storage
- **Memory Security**: Passphrase is cleared from memory when locked

## 📱 Usage

### Creating Your First Profile

1. Go to the **Settings** tab
2. Find the **Encrypted Connection Profiles** section
3. Click **Create Profile**
4. Enter your Redis connection details
5. Create a strong passphrase (or use the generator)
6. Click **Create & Save**

### Unlocking Profiles

1. When you reload the app, you'll see a passphrase dialog
2. Enter your passphrase to unlock your profiles
3. All your saved connections will be available

### Managing Profiles

- **Connect**: Click the activity icon to connect to a profile
- **Lock**: Click the lock button to secure your profiles
- **Change Passphrase**: Update your passphrase (re-encrypts all profiles)
- **Delete**: Remove individual profiles
- **Clear All**: Remove all profiles (use with caution)

## 🔧 Technical Implementation

### Files Added
- `lib/connection-encryption.ts` - AES encryption utilities
- `lib/connection-profiles-storage.ts` - IndexedDB storage layer
- `components/passphrase-dialog.tsx` - Passphrase input UI
- `hooks/use-encrypted-profiles.ts` - Profile management hook
- `components/encrypted-profiles-manager.tsx` - Main UI component

### Browser Requirements
- Modern browser with Web Crypto API support
- IndexedDB support
- Secure context (HTTPS or localhost)

### Fallback Behavior
- If encryption is not supported, shows appropriate error message
- Graceful degradation for older browsers
- Clear error messages for troubleshooting

## 🎯 Use Cases

- **Development**: Store multiple Redis instances (local, staging, production)
- **Teams**: Each developer can have their own encrypted profiles
- **Security**: Sensitive production credentials stay encrypted locally
- **Offline Work**: Access saved connections without internet
- **Privacy**: No external services or servers involved

## ⚠️ Important Notes

- **Remember Your Passphrase**: If you forget it, your profiles cannot be recovered
- **Browser Data**: Clearing browser data will remove your profiles
- **Backup**: Consider exporting important connection details separately
- **Updates**: Profiles are automatically migrated when the app updates

## 🔍 Troubleshooting

### "Encryption not supported"
- Ensure you're using a modern browser
- Check that you're on HTTPS or localhost
- Try refreshing the page

### "Invalid passphrase"
- Double-check your passphrase spelling
- Ensure caps lock is not enabled
- Try typing the passphrase in a text editor first

### "Failed to save profile"
- Check that IndexedDB is available
- Try clearing browser data and starting fresh
- Ensure you have sufficient storage space

---

**Enjoy secure, offline-capable Redis connection management!** 🎉
