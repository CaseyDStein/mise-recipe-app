package expo.modules.shareintent

import android.content.Intent
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ShareIntentModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ShareIntent")

    Events("onSharedUrl")

    // Called on cold start or when reading the intent that launched the app.
    AsyncFunction("getSharedUrl") {
      val activity = appContext.activityProvider?.currentActivity ?: return@AsyncFunction null
      val intent = activity.intent ?: return@AsyncFunction null
      if (intent.action != Intent.ACTION_SEND) return@AsyncFunction null
      val text = intent.getStringExtra(Intent.EXTRA_TEXT) ?: return@AsyncFunction null
      // Clear so repeated calls don't return the same URL
      intent.removeExtra(Intent.EXTRA_TEXT)
      text
    }

    // Called when a new share intent arrives while the app is already running.
    OnNewIntent { intent ->
      if (intent.action == Intent.ACTION_SEND) {
        val text = intent.getStringExtra(Intent.EXTRA_TEXT)
        if (text != null) {
          intent.removeExtra(Intent.EXTRA_TEXT)
          sendEvent("onSharedUrl", mapOf("url" to text))
        }
      }
    }
  }
}
