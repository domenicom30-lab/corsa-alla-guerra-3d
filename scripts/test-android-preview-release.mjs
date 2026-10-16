import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const quality=readFileSync('.github/workflows/automated-quality.yml','utf8');
const build=readFileSync('.github/workflows/build-apk.yml','utf8');
const app=JSON.parse(readFileSync('capacitor.config.json','utf8'));
const pkg=JSON.parse(readFileSync('package.json','utf8'));
assert.equal(pkg.version,'2.8.0');
assert.equal(app.appId,'com.corsaguerra.arcadepreview28',
 'Preview app must coexist with earlier incompatibly signed Android APKs');
assert.ok(app.appName.includes('2.8'));
assert.ok(quality.includes('  preview_apk:'),'Quality workflow must provide on-demand preview');
assert.ok(quality.includes('    needs: quality'),'APK cannot ship before gameplay and graphical tests pass');
assert.ok(quality.includes("contains(github.event.head_commit.message, '[android-preview]')"),
 'Normal commits must never generate APK');
assert.ok(quality.includes('python3 scripts/verify_apk_assets.py'));
assert.ok(quality.includes('apksigner\" verify')||quality.includes('\"$TOOLS/apksigner\" verify'));
assert.ok(quality.includes("name='com.corsaguerra.arcadepreview28'"));
assert.ok(quality.includes('sha256sum \"$APK\"'));
assert.ok(quality.includes('uses: actions/upload-artifact@v4'));
assert.ok(quality.includes('path: |\n            android/app/build/outputs/apk/debug/app-debug.apk'));
assert.ok(build.includes('on:\n  workflow_dispatch:')&&!build.includes('\n  push:'),
 'Traditional APK workflow must remain manual-only');
assert.ok(build.includes("name='com.corsaguerra.arcadepreview28'"));
assert.ok(build.includes('versionName \"2.8.0\"'));
console.log('PASS: opt-in Android 2.8 pipeline, quality dependency, signing, APK asset checks, package isolation and artifact output');
