package com.hls.hotelapp;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 1. Set the layout to edge-to-edge to remove any automatic padding/gaps
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        // 2. Set status bar color (Transparent or White depending on preference)
        // If you want content to go behind the status bar, use TRANSPARENT.
        // For a solid white bar without a gap, use WHITE.
        getWindow().setStatusBarColor(Color.TRANSPARENT);

        // 3. Ensure status bar icons are dark (since background is likely light)
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        if (controller != null) {
            controller.setAppearanceLightStatusBars(true);
        }

        // 4. Handle back button logic
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                WebView webView = (WebView) findViewById(com.getcapacitor.android.R.id.webview);
                if (webView != null && webView.canGoBack()) {
                    webView.goBack();
                } else {
                    setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                }
            }
        });
    }
}
