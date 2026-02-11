package com.mdaminalsayeed.quranreader;

import android.graphics.Color;
import android.os.Bundle;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);
        splashScreen.setOnExitAnimationListener((provider) -> provider.remove());
        super.onCreate(savedInstanceState);

        // Keep transition from splash to WebView dark to avoid white flash.
        getWindow().getDecorView().setBackgroundColor(Color.parseColor("#05080C"));
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().setBackgroundColor(Color.parseColor("#05080C"));
        }
    }
}
