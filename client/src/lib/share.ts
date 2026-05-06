import { Share } from '@capacitor/share';

export async function shareContent({ title, text, url }: { title: string; text: string; url: string }) {
  try {
    // Attempt Capacitor Share first (Native Android/iOS)
    const canShareResult = await Share.canShare();
    if (canShareResult.value) {
      await Share.share({ title, text, url, dialogTitle: 'Compartir' });
      return 'native';
    } 
    
    // Fallback to Web Share API (Desktop Browsers like Safari/Edge)
    if (navigator.share) {
      await navigator.share({ title, text, url });
      return 'web';
    }

    // Fallback to Clipboard (Desktop Chrome if not supported)
    await navigator.clipboard.writeText(`${title} - ${url}`);
    return 'clipboard';

  } catch (err: any) {
    // AbortError is common when the user cancels the share sheet
    if (err.name !== 'AbortError' && err.message !== 'Share canceled') {
      console.error("Error compartiendo:", err);
    }
    throw err;
  }
}
