const { withXcodeProject, withEntitlementsPlist, withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const APP_GROUP_ID = 'group.com.therecipeorganizer.app';
const EXTENSION_NAME = 'ShareExtension';
const EXTENSION_BUNDLE_ID = 'com.therecipeorganizer.app.ShareExtension';

/** Step 1 – add App Group entitlement to the main app */
function withMainAppEntitlements(config) {
  return withEntitlementsPlist(config, (mod) => {
    const ent = mod.modResults;
    const key = 'com.apple.security.application-groups';
    if (!Array.isArray(ent[key])) ent[key] = [];
    if (!ent[key].includes(APP_GROUP_ID)) ent[key].push(APP_GROUP_ID);
    return mod;
  });
}

/** Step 2 – copy ShareExtension source files into ios/<EXTENSION_NAME>/ */
function withShareExtensionFiles(config) {
  return withDangerousMod(config, [
    'ios',
    (mod) => {
      const { platformProjectRoot, projectRoot } = mod.modRequest;
      const srcDir = path.join(projectRoot, EXTENSION_NAME);
      const destDir = path.join(platformProjectRoot, EXTENSION_NAME);

      if (!fs.existsSync(srcDir)) {
        throw new Error(`[withShareExtension] Source directory missing: ${srcDir}`);
      }
      fs.mkdirSync(destDir, { recursive: true });

      for (const file of fs.readdirSync(srcDir)) {
        fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
      }

      // Write the extension's entitlements file
      fs.writeFileSync(
        path.join(destDir, `${EXTENSION_NAME}.entitlements`),
        `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.application-groups</key>
  <array>
    <string>${APP_GROUP_ID}</string>
  </array>
</dict>
</plist>`
      );

      return mod;
    },
  ]);
}

/** Step 3 – add the extension target to the Xcode project and embed it in the main app */
function withShareExtensionTarget(config) {
  return withXcodeProject(config, (mod) => {
    const proj = mod.modResults;

    // Idempotent: skip if already added.
    // pbxTargetByName compares comment strings which may include embedded quotes, so
    // check the name field directly instead.
    const nativeTargets = proj.hash.project.objects['PBXNativeTarget'] || {};
    const alreadyExists = Object.values(nativeTargets).some(
      (t) => typeof t === 'object' && String(t.name || '').replace(/"/g, '') === EXTENSION_NAME
    );
    if (alreadyExists) return mod;

    // --- Create the extension target (also creates Sources + Resources build phases) ---
    const extTarget = proj.addTarget(
      EXTENSION_NAME,
      'app_extension',
      EXTENSION_NAME,
      EXTENSION_BUNDLE_ID
    );

    // --- Patch build settings on every configuration ---
    const configListKey = extTarget.pbxNativeTarget.buildConfigurationList;
    const configList = proj.pbxXCConfigurationList()[configListKey];
    for (const { value: cfgKey } of configList.buildConfigurations) {
      const cfg = proj.pbxXCBuildConfigurationSection()[cfgKey];
      if (!cfg) continue;
      Object.assign(cfg.buildSettings, {
        CLANG_ENABLE_MODULES: 'YES',
        CODE_SIGN_ENTITLEMENTS: `"${EXTENSION_NAME}/${EXTENSION_NAME}.entitlements"`,
        INFOPLIST_FILE: `"${EXTENSION_NAME}/Info.plist"`,
        IPHONEOS_DEPLOYMENT_TARGET: '16.0',
        LD_RUNPATH_SEARCH_PATHS:
          '"$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"',
        PRODUCT_BUNDLE_IDENTIFIER: `"${EXTENSION_BUNDLE_ID}"`,
        PRODUCT_NAME: `"${EXTENSION_NAME}"`,
        SKIP_INSTALL: 'YES',
        SWIFT_VERSION: '"5.0"',
        TARGETED_DEVICE_FAMILY: '"1,2"',
      });
    }

    // --- Create a PBX group for the extension files ---
    // Must create the group BEFORE calling addSourceFile so we can pass the group UUID
    // (otherwise addSourceFile falls back to addPluginFile, which crashes).
    const groupResult = proj.addPbxGroup([], EXTENSION_NAME, EXTENSION_NAME);

    // Attach the new group to the project's root PBXGroup
    const pbxGroups = proj.hash.project.objects['PBXGroup'] || {};
    const rootGroupKey = Object.keys(pbxGroups).find(
      (k) =>
        !k.endsWith('_comment') &&
        pbxGroups[k].name === undefined &&
        pbxGroups[k].path === undefined
    );
    if (rootGroupKey) {
      pbxGroups[rootGroupKey].children.push({ value: groupResult.uuid, comment: EXTENSION_NAME });
    }

    // --- Create a Sources build phase and add ShareViewController.swift to it ---
    //
    // addTarget('app_extension') calls addBuildPhase() for Sources/Resources BEFORE the
    // target is registered in PBXNativeTarget, so addBuildPhase's code that attaches the
    // phase to the target silently does nothing. The target ends up with buildPhases=[].
    // We create and attach the Sources phase ourselves.

    // File reference — path is relative to the group (group.path = "ShareExtension"),
    // so just the filename here avoids the doubled-path bug.
    const fileRefUuid = proj.generateUuid();
    const fileRefs = proj.hash.project.objects['PBXFileReference'] || {};
    fileRefs[fileRefUuid] = {
      isa: 'PBXFileReference',
      lastKnownFileType: 'sourcecode.swift',
      name: 'ShareViewController.swift',
      path: 'ShareViewController.swift',
      sourceTree: '"<group>"',
    };
    fileRefs[`${fileRefUuid}_comment`] = 'ShareViewController.swift';
    proj.hash.project.objects['PBXFileReference'] = fileRefs;

    // Add the file reference to the group's children
    const groupsSection = proj.hash.project.objects['PBXGroup'] || {};
    if (groupsSection[groupResult.uuid]) {
      groupsSection[groupResult.uuid].children.push({
        value: fileRefUuid,
        comment: 'ShareViewController.swift',
      });
    }

    // Build file entry
    const buildFileUuid = proj.generateUuid();
    const buildFiles = proj.hash.project.objects['PBXBuildFile'] || {};
    buildFiles[buildFileUuid] = { isa: 'PBXBuildFile', fileRef: fileRefUuid };
    buildFiles[`${buildFileUuid}_comment`] = 'ShareViewController.swift in Sources';
    proj.hash.project.objects['PBXBuildFile'] = buildFiles;

    // Sources build phase for the extension
    const sourcesPhaseUuid = proj.generateUuid();
    const sourcesSection = proj.hash.project.objects['PBXSourcesBuildPhase'] || {};
    sourcesSection[sourcesPhaseUuid] = {
      isa: 'PBXSourcesBuildPhase',
      buildActionMask: 2147483647,
      files: [{ value: buildFileUuid, comment: 'ShareViewController.swift in Sources' }],
      runOnlyForDeploymentPostprocessing: 0,
    };
    sourcesSection[`${sourcesPhaseUuid}_comment`] = 'Sources';
    proj.hash.project.objects['PBXSourcesBuildPhase'] = sourcesSection;

    // Attach Sources phase to the extension target (overwrite the empty/broken buildPhases
    // that addTarget left behind)
    const nativeTargetsSection = proj.hash.project.objects['PBXNativeTarget'] || {};
    if (nativeTargetsSection[extTarget.uuid]) {
      nativeTargetsSection[extTarget.uuid].buildPhases = [
        { value: sourcesPhaseUuid, comment: 'Sources' },
      ];
    }

    // NOTE: addTarget('app_extension') automatically:
    //   1. Creates a "Copy Files" build phase (dstSubfolderSpec=13) on the main app target
    //   2. Adds addTargetDependency from main app → extension
    // No manual embed phase or dependency needed — adding them would duplicate both.

    return mod;
  });
}

module.exports = (config) => {
  config = withMainAppEntitlements(config);
  config = withShareExtensionFiles(config);
  config = withShareExtensionTarget(config);
  return config;
};
