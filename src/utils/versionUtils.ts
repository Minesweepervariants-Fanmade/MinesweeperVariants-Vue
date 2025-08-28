import { useSettings } from "@/composables/useSettings";

const { settings } = useSettings();

export interface Version {
    major: number;
    minor: number;
    patch: number;
}

export interface TupleVersion extends Array<number> {
    0: number; // major
    1: number; // minor
    2: number; // patch
}

export function parseTupleVersion(version: TupleVersion): Version {
    return {
        major: version[0],
        minor: version[1],
        patch: version[2]
    };
}

const currentVersionString = (import.meta.env.PACKAGE_VERSION ?? '0.0.0') as string;

console.log(`Version: ${currentVersionString}`)

const currentVersion: Version = (() => {
    const parts = currentVersionString.split('.').map(p => parseInt(p, 10) || 0);
    const tuple: TupleVersion = [parts[0] || 0, parts[1] || 0, parts[2] || 0];
    return parseTupleVersion(tuple);
})();

export function versionToString(version: Version): string {
    return `${version.major}.${version.minor}.${version.patch}`;
}

export function validate(version: Version) {
    if (version.major !== currentVersion.major && !settings.value.ignoreVersionErrors) {
        alert(`Incompatible major version: ${versionToString(version)}. Expected: ${versionToString(currentVersion)}`);
        return false;
    }

    if (version.minor !== currentVersion.minor && !settings.value.ignoreVersionErrors) {
        alert(`Incompatible minor version: ${versionToString(version)}. Expected: ${versionToString(currentVersion)}`);
        return true;
    }

    if (version.patch !== currentVersion.patch && !settings.value.ignoreVersionErrors) {
        console.warn(`Incompatible patch version: ${versionToString(version)}. Expected: ${versionToString(currentVersion)}`);
        return true
    }

    if (settings.value.ignoreVersionErrors && version !== currentVersion) {
        console.warn(`Ignoring incompatible version: ${versionToString(version)}. Expected: ${versionToString(currentVersion)}`);
    }

    return true
}