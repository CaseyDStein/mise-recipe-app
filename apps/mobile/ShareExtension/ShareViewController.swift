import UIKit
import UniformTypeIdentifiers

class ShareViewController: UIViewController {
  private let appGroupId = "group.com.therecipeorganizer.app"
  private let pendingUrlKey = "pendingSharedUrl"
  private let appScheme = "therecipeorganizer"

  override func viewDidAppear(_ animated: Bool) {
    super.viewDidAppear(animated)
    extractUrl()
  }

  private func extractUrl() {
    guard
      let item = extensionContext?.inputItems.first as? NSExtensionItem,
      let provider = item.attachments?.first
    else {
      complete()
      return
    }

    if provider.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
      provider.loadItem(forTypeIdentifier: UTType.url.identifier) { [weak self] data, _ in
        let urlString = (data as? URL)?.absoluteString ?? (data as? String)
        if let urlString, URL(string: urlString) != nil {
          self?.handleUrl(urlString)
        } else {
          self?.complete()
        }
      }
    } else if provider.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) {
      provider.loadItem(forTypeIdentifier: UTType.plainText.identifier) { [weak self] data, _ in
        let text = data as? String ?? ""
        // Use NSDataDetector to pull the first URL out of the shared text
        if let detector = try? NSDataDetector(types: NSTextCheckingResult.CheckingType.link.rawValue),
           let match = detector.firstMatch(in: text, range: NSRange(text.startIndex..., in: text)),
           let url = match.url {
          self?.handleUrl(url.absoluteString)
        } else {
          self?.complete()
        }
      }
    } else {
      complete()
    }
  }

  private func handleUrl(_ urlString: String) {
    // Save to App Group as a fallback for the AppState listener.
    if let defaults = UserDefaults(suiteName: appGroupId) {
      defaults.set(urlString, forKey: pendingUrlKey)
      defaults.synchronize()
    }

    // Open the main app via URL scheme with root path (no /import segment) so
    // Expo Router lands on the home screen rather than the import modal.
    if let encoded = urlString.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
       let appUrl = URL(string: "\(appScheme)://?url=\(encoded)") {
      var responder: UIResponder? = self
      while let r = responder {
        if let application = r as? UIApplication {
          application.open(appUrl, options: [:], completionHandler: nil)
          break
        }
        responder = r.next
      }
    }

    complete()
  }

  private func complete() {
    DispatchQueue.main.async {
      self.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
    }
  }
}
