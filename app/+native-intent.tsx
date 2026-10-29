// Android hands NDEF URI tags to the activity as an NDEF_DISCOVERED intent, so
// React Native reports the tag's URI (tel:, https:, mailto:, …) as a deep
// link. The NFC code already turns the tag into a scan sheet, and the app has
// no deep links of its own, so those URLs must not move the router: returning
// null leaves the app on its current screen.
const TAG_URI = /^(https?|tel|sms|smsto|mailto|geo|ftp):/i;

export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}): string | null {
  // The dev client opens the project with its own URL.
  if (path.startsWith('expo-development-client')) return path;
  if (TAG_URI.test(path)) return null;
  return path;
}
