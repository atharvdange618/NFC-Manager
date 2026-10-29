import { redirectSystemPath } from '../../../app/+native-intent';

describe('redirectSystemPath', () => {
  const path = (url: string) => redirectSystemPath({ path: url, initial: true });

  it.each([
    'tel:+919021538071',
    'https://example.com/post/1',
    'http://example.com',
    'mailto:hi@example.com',
    'sms:+919021538071',
    'smsto:+919021538071',
    'geo:19.076,72.8777',
    'ftp://example.com/file',
  ])('ignores the NFC tag URI %s', url => {
    expect(path(url)).toBeNull();
  });

  it('lets the dev client open its project', () => {
    expect(path('expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081')).toBe(
      'expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081',
    );
  });

  it('lets the app scheme through', () => {
    expect(path('nfcmanager://result')).toBe('nfcmanager://result');
  });
});
