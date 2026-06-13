import ExpoModulesCore
import Foundation

public class ShareIntentModule: Module {
  private let appGroupId = "group.com.therecipeorganizer.app"
  private let pendingUrlKey = "pendingSharedUrl"

  public func definition() -> ModuleDefinition {
    Name("ShareIntent")

    // Returns a URL saved by the Share Extension via App Group, then clears it.
    // Returns nil if no URL is pending.
    AsyncFunction("getSharedUrl") { () -> String? in
      guard let defaults = UserDefaults(suiteName: self.appGroupId) else { return nil }
      let url = defaults.string(forKey: self.pendingUrlKey)
      if url != nil {
        defaults.removeObject(forKey: self.pendingUrlKey)
        defaults.synchronize()
      }
      return url
    }
  }
}
