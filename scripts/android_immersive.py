#!/usr/bin/env python3
"""Enable genuine Android immersive landscape mode in the generated Capacitor app.

Run after `npx cap add android && npx cap sync android`. The module is
idempotent and sources the package ID from capacitor.config.json, so a
separately signed test APK cannot accidentally overwrite an older install.
"""
from pathlib import Path
import argparse
import json
import re
import tempfile


def native_activity(package):
    assert re.fullmatch(r"[a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*)+", package), (
        "Unsafe Android package identifier", package
    )
    return """package %s;

import android.content.pm.ActivityInfo;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

/** Original fullscreen 2D arcade: tap controls are never covered by Android bars. */
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle state) {
        super.onCreate(state);
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                             WindowManager.LayoutParams.FLAG_FULLSCREEN);
        enterImmersive();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) enterImmersive();
    }

    private void enterImmersive() {
        final View decor = getWindow().getDecorView();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowInsetsController controller = decor.getWindowInsetsController();
            if (controller != null) {
                controller.hide(WindowInsets.Type.statusBars() |
                                WindowInsets.Type.navigationBars());
                controller.setSystemBarsBehavior(
                    WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            decor.setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY |
                View.SYSTEM_UI_FLAG_FULLSCREEN |
                View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
                View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
                View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
        }
    }
}
""" % package


def configure(root):
    root=Path(root)
    config=json.loads((root/"capacitor.config.json").read_text(encoding="utf-8"))
    package=config["appId"]
    native=root/"android/app/src/main/java"/Path(*package.split("."))/"MainActivity.java"
    if not native.exists():
        raise FileNotFoundError(
            f"Expected Capacitor-generated native Activity missing: {native}. "
            "Run npx cap add android before this step."
        )
    content=native_activity(package)
    native.write_text(content,encoding="utf-8")
    print(f"PASS: Android immersive landscape installed: {native}")
    return native


def self_test():
    with tempfile.TemporaryDirectory() as temp:
        root=Path(temp)
        package="com.corsaguerra.arcadepreview28"
        (root/"capacitor.config.json").write_text(
            json.dumps({"appId":package}),encoding="utf-8")
        target=root/"android/app/src/main/java"/Path(*package.split("."))/"MainActivity.java"
        target.parent.mkdir(parents=True)
        target.write_text("package "+package+";\n",encoding="utf-8")
        path=configure(root)
        first=path.read_text(encoding="utf-8")
        assert "extends BridgeActivity" in first
        assert "SCREEN_ORIENTATION_SENSOR_LANDSCAPE" in first
        assert "WindowInsets.Type.statusBars()" in first
        assert "WindowInsets.Type.navigationBars()" in first
        assert "BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE" in first
        assert "SYSTEM_UI_FLAG_IMMERSIVE_STICKY" in first
        assert first.startswith("package "+package+";")
        assert configure(root)==path and path.read_text()==first
        print("PASS: non-root Android 11+/legacy immersive, swipe-to-reveal and repeatable packaging")


if __name__=="__main__":
    cli=argparse.ArgumentParser()
    cli.add_argument("--self-test",action="store_true")
    args=cli.parse_args()
    if args.self_test:self_test()
    else:configure(Path(__file__).resolve().parent.parent)
