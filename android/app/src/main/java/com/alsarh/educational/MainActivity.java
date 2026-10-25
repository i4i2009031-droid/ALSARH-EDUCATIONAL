package com.alsarh.educational;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.os.Build;
import android.widget.FrameLayout;
import android.graphics.Insets;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.SslErrorHandler;
import android.net.http.SslError;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.EditText;
import android.widget.Toast;

import androidx.webkit.WebViewAssetLoader;

import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/**
 * Two explicit workspaces:
 *  1) Local, bundled and persistent (IndexedDB, no network needed).
 *  2) School server, configured later over HTTPS (distinct origin and storage).
 * No remote URL, API token, or sensitive student data is hard-coded into the APK.
 */
public class MainActivity extends Activity {
    private static final int NAVY = Color.rgb(9, 46, 98);
    private static final int EXPORT_JSON = 1102;
    private static final int PICK_IMPORT = 1103;
    private static final String LOCAL_URL = "https://appassets.androidplatform.net/assets/index.html";
    private WebView web;
    private FrameLayout safeContainer;
    private String serverUrl = "";
    private String pendingBackup = "";
    private ValueCallback<Uri[]> importCallback;
    private WebViewAssetLoader assets;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        // Android 15+ enforces edge-to-edge for apps targeting API 35.
        // Reserve the actual system bar + display cutout insets before WebView renders.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            getWindow().setDecorFitsSystemWindows(false);
            getWindow().setStatusBarColor(Color.TRANSPARENT);
            getWindow().setNavigationBarColor(Color.TRANSPARENT);
            getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
            if (Build.VERSION.SDK_INT >= 29) getWindow().setNavigationBarContrastEnforced(false);
        } else {
            getWindow().setStatusBarColor(NAVY);
            getWindow().setNavigationBarColor(Color.WHITE);
            getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
        }
        serverUrl = getPreferences(Context.MODE_PRIVATE).getString("server_url", "");
        assets = new WebViewAssetLoader.Builder()
            .setDomain("appassets.androidplatform.net")
            .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
            .build();
        makeWebView();
        web.loadUrl(serverUrl.isEmpty() ? LOCAL_URL : serverUrl);
    }

    private boolean isLocal() { return serverUrl.isEmpty(); }

    @SuppressLint("SetJavaScriptEnabled")
    private void makeWebView() {
        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(243, 246, 251));
        web.getSettings().setJavaScriptEnabled(true);
        web.getSettings().setDomStorageEnabled(true);
        web.getSettings().setAllowFileAccess(false);
        web.getSettings().setAllowContentAccess(false);
        web.getSettings().setJavaScriptCanOpenWindowsAutomatically(false);
        web.getSettings().setSupportMultipleWindows(false);
        web.getSettings().setBuiltInZoomControls(false);
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(web, false);
        web.addJavascriptInterface(new NativeBridge(), "ALSARH_NATIVE");
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (importCallback != null) importCallback.onReceiveValue(null);
                importCallback = callback;
                Intent picker = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                picker.addCategory(Intent.CATEGORY_OPENABLE);
                picker.setType("application/json");
                picker.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"application/json", "text/plain", "application/octet-stream"});
                try {startActivityForResult(picker, PICK_IMPORT);return true;}
                catch (Exception ex){importCallback=null;callback.onReceiveValue(null);return false;}
            }
        });
        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("appassets.androidplatform.net".equalsIgnoreCase(uri.getHost())) return assets.shouldInterceptRequest(uri);
                return super.shouldInterceptRequest(view, request);
            }
            @Override public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {handler.cancel();}
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (LOCAL_URL.startsWith(uri.toString()) || uri.toString().startsWith("https://appassets.androidplatform.net/assets/")) return false;
                Uri origin=Uri.parse(serverUrl);
                if (!isLocal() && "https".equalsIgnoreCase(uri.getScheme()) && uri.getHost() != null && uri.getHost().equalsIgnoreCase(origin.getHost())) return false;
                if ("https".equalsIgnoreCase(uri.getScheme())) {startActivity(new Intent(Intent.ACTION_VIEW, uri));return true;}
                return true;
            }
            @Override public void onReceivedError(WebView view, WebResourceRequest request, android.webkit.WebResourceError error) {
                if (!isLocal() && request.isForMainFrame()) Toast.makeText(MainActivity.this, "تعذر الاتصال بالخادم. يمكنك العودة للتجربة المحلية من الإعدادات.", Toast.LENGTH_LONG).show();
            }
        });
        safeContainer = new FrameLayout(this);
        safeContainer.setBackgroundColor(Color.WHITE);
        safeContainer.addView(web, new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            safeContainer.setOnApplyWindowInsetsListener((v, windowInsets) -> {
                Insets bars = windowInsets.getInsets(
                    WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                // Keep the app header below the clock/camera and the mobile
                // navigation safely above Android's system buttons and keyboard.
                Insets keyboard = windowInsets.getInsets(WindowInsets.Type.ime());
                v.setPadding(bars.left, bars.top, bars.right,
                    Math.max(bars.bottom, keyboard.bottom));
                return windowInsets;
            });
        }
        setContentView(safeContainer);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) safeContainer.requestApplyInsets();
    }

    private String validatedHttps(String raw) {
        try {
            Uri uri = Uri.parse(raw.trim());
            if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null || uri.getHost().isEmpty() || uri.getUserInfo()!=null || uri.getHost().equals("example.com")) throw new IllegalArgumentException();
            if (uri.getQuery()!=null || uri.getFragment()!=null) throw new IllegalArgumentException();
            return uri.getScheme()+"://"+uri.getAuthority();
        }catch(Exception ignored){return null;}
    }

    private void chooseServer() {
        EditText input=new EditText(this);
        input.setSingleLine(true);
        input.setTextDirection(View.TEXT_DIRECTION_LTR);
        input.setText(serverUrl);
        input.setHint("https://school.yourdomain.com");
        input.setPadding(30,20,30,20);
        new AlertDialog.Builder(this)
            .setTitle("ربط منظومة الصرح التعليمي")
            .setMessage("بعد نشر نسخة الويب والخادم على Hostinger، أدخل رابط HTTPS الحقيقي. تبقى بيانات الوضع المحلي محفوظة بشكل مستقل.")
            .setView(input)
            .setNegativeButton("إلغاء",(dialog,which)->{})
            .setPositiveButton("اتصال",(dialog,which)->{
                String target=validatedHttps(input.getText().toString());
                if(target==null){Toast.makeText(this,"يرجى إدخال رابط HTTPS صحيح",Toast.LENGTH_LONG).show();return;}
                serverUrl=target;
                getPreferences(Context.MODE_PRIVATE).edit().putString("server_url", target).apply();
                web.loadUrl(target);
            }).show();
    }

    public final class NativeBridge {
        @JavascriptInterface public void chooseServer() {runOnUiThread(()->MainActivity.this.chooseServer());}
        @JavascriptInterface public void useOffline() {runOnUiThread(()->{
            serverUrl="";
            getPreferences(Context.MODE_PRIVATE).edit().remove("server_url").apply();
            web.loadUrl(LOCAL_URL);
        });}
        @JavascriptInterface public void exportBackup(String data) {runOnUiThread(()->{
            if(!isLocal())return;
            if(data==null || data.length()>12*1024*1024){Toast.makeText(MainActivity.this,"النسخة كبيرة جداً",Toast.LENGTH_LONG).show();return;}
            pendingBackup=data;
            Intent i=new Intent(Intent.ACTION_CREATE_DOCUMENT);
            i.addCategory(Intent.CATEGORY_OPENABLE);
            i.setType("application/json");
            i.putExtra(Intent.EXTRA_TITLE,"alsarh-local-backup.json");
            startActivityForResult(i,EXPORT_JSON);
        });}
    }

    @Override protected void onActivityResult(int req,int result,Intent data) {
        super.onActivityResult(req,result,data);
        if(req==PICK_IMPORT){
            if(importCallback!=null)importCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result,data));
            importCallback=null;
        }else if(req==EXPORT_JSON){
            if(result==RESULT_OK&&data!=null&&data.getData()!=null){
                try(OutputStream out=getContentResolver().openOutputStream(data.getData())) {
                    if(out==null)throw new IllegalStateException("Storage inaccessible");
                    out.write(pendingBackup.getBytes(StandardCharsets.UTF_8));
                    Toast.makeText(this,"تم حفظ النسخة الاحتياطية",Toast.LENGTH_LONG).show();
                }catch(Exception ex){Toast.makeText(this,"فشل حفظ النسخة",Toast.LENGTH_LONG).show();}
            }
            pendingBackup="";
        }
    }
    @Override public void onBackPressed() {if(web!=null&&web.canGoBack())web.goBack();else super.onBackPressed();}
    @Override protected void onPause() {super.onPause();CookieManager.getInstance().flush();}
    @Override protected void onDestroy() {if(web!=null){web.destroy();web=null;}super.onDestroy();}
}
