# CI / GitHub Actions

## EAS Preview Build (`eas-preview.yml`)

Triggers on every pull request (opened, synchronized, or reopened) and submits an Android APK build to Expo Application Services (EAS). A comment is automatically posted on the PR with links to the build details page and APK download once available.

### Required secret

| Secret name  | Where to create it                                                  | Used by                          |
|-------------|----------------------------------------------------------------------|----------------------------------|
| `EXPO_TOKEN` | expo.dev → Account Settings → Access Tokens → Create Token          | `expo/expo-github-action@v8` step |

The `EXPO_TOKEN` secret **has been configured** in this repository's GitHub Actions secrets (Settings → Secrets and variables → Actions).

### EAS build profile

The workflow uses the `preview` profile defined in `artifacts/pots-companion/eas.json`:

```json
"preview": {
  "distribution": "internal",
  "android": { "buildType": "apk" }
}
```

### Verified

PR #2 (https://github.com/emamianahita991-max/norovia/pull/2) confirmed the workflow runs end-to-end:

- All steps pass including `Set up Expo and EAS` (EXPO_TOKEN authenticated)
- `eas build` submits the job to Expo's cloud infrastructure
- Bot posts a comment on the PR with the build details page URL and APK link

### How the PR comment works

The workflow runs `eas build --non-interactive --json` which returns structured JSON with `buildDetailsPageUrl` and `artifacts.buildUrl`. These are parsed and posted as a PR comment by `actions/github-script`.
