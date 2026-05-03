# CI / GitHub Actions

## EAS Preview Build (`eas-preview.yml`)

Triggers on every pull request (opened, synchronized, or reopened) and builds an Android APK using Expo Application Services (EAS). A comment is automatically posted on the PR with a link to the build details page and a direct APK download link once the build finishes.

### Required secret

| Secret name  | Where to create it                                                  | Used by                          |
|-------------|----------------------------------------------------------------------|----------------------------------|
| `EXPO_TOKEN` | expo.dev → Account Settings → Access Tokens → Create Token          | `expo/expo-github-action@v8` step |

To add this secret to the repository:
1. Go to the repository on GitHub
2. Navigate to **Settings → Secrets and variables → Actions**
3. Click **New repository secret**
4. Name: `EXPO_TOKEN`, Value: your Expo access token

### EAS build profile

The workflow uses the `preview` profile defined in `artifacts/pots-companion/eas.json`:

```json
"preview": {
  "distribution": "internal",
  "android": { "buildType": "apk" }
}
```

### Verifying the workflow

Open a pull request against `main`. The `EAS Preview Build` workflow will start automatically. Once the EAS build finishes (typically 10–20 minutes), the bot will post a comment on the PR with:

- A link to the EAS build details page
- A direct download link for the APK (if available immediately)
