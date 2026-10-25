package com.alsarh.educational;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.os.Build;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.SslErrorHandler;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceError;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.net.http.SslError;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.text.InputType;
import android.net.Uri;

public class MainActivity extends Activity {
    private final int NAVY = Color.rgb(9,46,98);
    private WebView web;
    private String serverUrl;
    private LinearLayout root;
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(NAVY);
        getWindow().setNavigationBarColor(Color.WHITE);
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
        serverUrl = getPreferences(Context.MODE_PRIVATE).getString("server_url", "");
        if (serverUrl.isEmpty()) showSetup(); else showWeb();
    }
    private LinearLayout layout() {
        LinearLayout out = new LinearLayout(this);
        out.setOrientation(LinearLayout.VERTICAL);
        out.setGravity(Gravity.CENTER);
        out.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        out.setBackgroundColor(Color.rgb(244,247,252));
        out.setPadding(dp(24),dp(32),dp(24),dp(24));
        return out;
    }
    private TextView text(String s, int size, int color) {
        TextView t=new TextView(this);
        t.setText(s);t.setTextSize(size);t.setTextColor(color);t.setGravity(Gravity.CENTER);t.setPadding(0,dp(10),0,dp(10));
        return t;
    }
    private int dp(int v){return Math.round(getResources().getDisplayMetrics().density*v);}
    private void showSetup(){
        root=layout();root.addView(text("الصرح التعليمي",29,NAVY));
        root.addView(text("ALSARH EDUCATIONAL SYSTEM",13,Color.GRAY));
        root.addView(text("أدخل رابط HTTPS لخادم المؤسسة بعد نشر نسخة الويب.",15,NAVY));
        EditText input=new EditText(this);input.setSingleLine(true);input.setTextDirection(View.TEXT_DIRECTION_LTR);
        input.setHint("https://school.example.com");input.setInputType(InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_URI);
        root.addView(input,new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,dp(64)));
        TextView warning=text("البيانات لا تُخزّن على هذا الهاتف؛ يتم حفظها في خادم مدرستك.",12,Color.GRAY);root.addView(warning);
        Button open=new Button(this);open.setText("فتح المنظومة");open.setTextColor(Color.WHITE);open.setBackgroundTintList(android.content.res.ColorStateList.valueOf(NAVY));
        root.addView(open,new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,dp(55)));
        open.setOnClickListener(v->{String s=input.getText().toString().trim();try{Uri u=Uri.parse(s);if(!"https".equalsIgnoreCase(u.getScheme())||u.getHost()==null||u.getHost().isEmpty()||u.getUserInfo()!=null||u.getHost().equals("example.com"))throw new IllegalArgumentException();serverUrl=u.getScheme()+"://"+u.getAuthority();getPreferences(Context.MODE_PRIVATE).edit().putString("server_url",serverUrl).apply();showWeb();}catch(Exception ex){input.setError("أدخل رابط HTTPS صحيحًا");}});
        setContentView(root);
    }
    private void showWeb(){
        web=new WebView(this);web.setBackgroundColor(Color.WHITE);
        web.getSettings().setJavaScriptEnabled(true);
        web.getSettings().setDomStorageEnabled(true);
        web.getSettings().setAllowFileAccess(false);
        web.getSettings().setAllowContentAccess(false);
        web.getSettings().setJavaScriptCanOpenWindowsAutomatically(false);
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(web,false);
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient(){
            @Override public void onReceivedSslError(WebView view,SslErrorHandler handler,SslError error){handler.cancel();}
            @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){
                Uri url=request.getUrl(); Uri configured=Uri.parse(serverUrl);
                if("https".equalsIgnoreCase(url.getScheme())&&url.getHost()!=null&&url.getHost().equalsIgnoreCase(configured.getHost()))return false;
                if("https".equalsIgnoreCase(url.getScheme())){startActivity(new Intent(Intent.ACTION_VIEW,url));}
                return true;
            }
            @Override public void onReceivedError(WebView view,WebResourceRequest request,WebResourceError error){
                if(request.isForMainFrame()) android.widget.Toast.makeText(MainActivity.this,"تعذر الاتصال بخادم الصرح التعليمي. تحقق من الإنترنت.",android.widget.Toast.LENGTH_LONG).show();
            }
        });
        setContentView(web);
        web.loadUrl(serverUrl);
    }
    @Override public void onBackPressed(){if(web!=null&&web.canGoBack())web.goBack();else super.onBackPressed();}
    @Override protected void onPause(){super.onPause();if(web!=null)CookieManager.getInstance().flush();}
    @Override protected void onDestroy(){if(web!=null){web.destroy();web=null;}super.onDestroy();}
}
