import Foundation
import Capacitor
import UIKit

@objc(NativeSettingsPlugin)
public class NativeSettingsPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NativeSettingsPlugin"
    public let jsName = "NativeSettings"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "openAppSettings", returnType: CAPPluginReturnPromise),
    ]

    @objc func openAppSettings(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let url = URL(string: UIApplication.openSettingsURLString) else {
                call.reject("Invalid settings URL")
                return
            }

            UIApplication.shared.open(url, options: [:]) { success in
                if success {
                    call.resolve()
                } else {
                    call.reject("Unable to open settings")
                }
            }
        }
    }
}

