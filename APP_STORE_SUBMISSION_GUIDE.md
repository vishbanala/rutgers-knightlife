# App Store Submission Troubleshooting Guide

## Error: "Cannot read properties of undefined (reading 'attributes')"

This error usually means:
1. App doesn't exist in App Store Connect yet
2. Authentication issue
3. Bundle ID mismatch

## Solution: Manual Submission (Most Reliable)

### Step 1: Download Your Build
1. Go to https://expo.dev/accounts/[your-account]/projects/RutgersNew/builds
2. Find your completed iOS production build
3. Download the `.ipa` file

### Step 2: Manual Upload via Transporter (Mac)
1. Download "Transporter" app from Mac App Store
2. Open Transporter
3. Drag your `.ipa` file into Transporter
4. Sign in with your Apple ID
5. Click "Deliver"

### Step 3: Manual Upload via Xcode (Mac)
1. Open Xcode
2. Go to Window → Organizer
3. Click "Distribute App"
4. Select your `.ipa` file
5. Follow the prompts

### Step 4: Manual Upload via Command Line (Mac)
```bash
xcrun altool --upload-app --type ios --file "path/to/your/app.ipa" --username "your-apple-id@email.com" --password "app-specific-password"
```

## Alternative: Fix EAS Submit

### Option 1: Check App Store Connect
1. Verify app exists: https://appstoreconnect.apple.com
2. Bundle ID must be: `com.vishbanala.rutgersknightlife`
3. App status should be "Prepare for Submission"

### Option 2: Use App-Specific Password
1. Go to https://appleid.apple.com
2. Sign in → App-Specific Passwords
3. Generate new password
4. Use this password when prompted by EAS

### Option 3: Try Interactive Mode
```bash
eas submit --platform ios --latest
```

### Option 4: Specify App ID Manually
```bash
eas submit --platform ios --id [your-app-id-from-app-store-connect]
```

## Quick Checklist

- [ ] App created in App Store Connect
- [ ] Bundle ID matches: `com.vishbanala.rutgersknightlife`
- [ ] Build completed successfully
- [ ] Using correct Apple ID
- [ ] App Store Connect app is in "Prepare for Submission" status



