package com.hamidyarali.rahbaz;

import android.app.Activity;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.ValueCallback;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Single-Activity WebView shell for RAHBAZ. The game (HTML/CSS/JS) lives in assets/www and is served from the
 * virtual HTTPS origin https://appassets.androidplatform.net/ through shouldInterceptRequest – there is no network
 * access at all (no INTERNET permission, every other origin is answered with 403).
 */
public class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String START_URL = "https://" + HOST + "/index.html";
    private WebView web;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Window w = getWindow();
        w.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        w.setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(Color.parseColor("#0B1F3A")));
        if (Build.VERSION.SDK_INT >= 28) {
            WindowManager.LayoutParams lp = w.getAttributes();
            lp.layoutInDisplayCutoutMode = 1; // LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
            w.setAttributes(lp);
        }
        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#0B1F3A"));
        setContentView(web);
        configure(web);
        web.loadUrl(START_URL);
        hideSystemUi();
    }

    private void configure(final WebView v) {
        WebSettings s = v.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setTextZoom(100);
        s.setGeolocationEnabled(false);
        s.setSaveFormData(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        v.setOverScrollMode(View.OVER_SCROLL_NEVER);
        v.setVerticalScrollBarEnabled(false);
        v.setHorizontalScrollBarEnabled(false);
        v.setLongClickable(false);
        v.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return serve(request.getUrl().getHost(), request.getUrl().getPath());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !HOST.equals(request.getUrl().getHost()); // never navigate away from the game
            }

            @Override
            public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                recreate();
                return true;
            }
        });
    }

    private WebResourceResponse serve(String host, String path) {
        if (!HOST.equals(host)) return blocked();
        if (path == null || path.length() == 0 || "/".equals(path)) path = "/index.html";
        if (path.contains("..")) return blocked();
        try {
            InputStream in = getAssets().open("www" + path);
            Map<String, String> headers = new HashMap<String, String>();
            headers.put("Cache-Control", "no-cache");
            headers.put("Access-Control-Allow-Origin", "https://" + HOST);
            WebResourceResponse r = new WebResourceResponse(mime(path), "UTF-8", in);
            r.setResponseHeaders(headers);
            return r;
        } catch (IOException e) {
            Map<String, String> h = new HashMap<String, String>();
            return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found", h, new ByteArrayInputStream(new byte[0]));
        }
    }

    private WebResourceResponse blocked() {
        Map<String, String> h = new HashMap<String, String>();
        return new WebResourceResponse("text/plain", "UTF-8", 403, "Blocked", h, new ByteArrayInputStream(new byte[0]));
    }

    private static String mime(String p) {
        String s = p.toLowerCase(Locale.US);
        if (s.endsWith(".html")) return "text/html";
        if (s.endsWith(".js")) return "application/javascript";
        if (s.endsWith(".css")) return "text/css";
        if (s.endsWith(".svg")) return "image/svg+xml";
        if (s.endsWith(".png")) return "image/png";
        if (s.endsWith(".woff2")) return "font/woff2";
        if (s.endsWith(".json")) return "application/json";
        if (s.endsWith(".txt")) return "text/plain";
        return "application/octet-stream";
    }

    private void hideSystemUi() {
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemUi();
    }

    /** Back button: the web app decides ('exit' | 'game' | 'menu' | 'busy'); only 'exit' closes the Activity. */
    @Override
    public void onBackPressed() {
        if (web == null) { super.onBackPressed(); return; }
        web.evaluateJavascript("(function(){try{return window.__ic&&window.__ic.back?window.__ic.back():'exit';}catch(e){return 'exit';}})()", new ValueCallback<String>() {
            @Override
            public void onReceiveValue(String value) {
                if (value == null || value.contains("exit")) MainActivity.super.onBackPressed();
            }
        });
    }

    @Override
    protected void onPause() {
        if (web != null) {
            web.evaluateJavascript("(function(){try{window.__ic&&window.__ic.bg&&window.__ic.bg();}catch(e){}})()", null);
            web.onPause();
        }
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) web.onResume();
        hideSystemUi();
    }

    @Override
    protected void onDestroy() {
        if (web != null) { web.stopLoading(); web.destroy(); web = null; }
        super.onDestroy();
    }
}
