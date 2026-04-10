let googleMapsLoadingPromise: Promise<void> | null = null;

export const loadGoogleMapsApi = (apiKey: string): Promise<void> => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps can only be loaded in the browser')); 
  }

  if (!apiKey) {
    return Promise.reject(new Error('Missing Google Maps API key. Set VITE_GOOGLE_MAPS_API_KEY in .env')); 
  }

  if (googleMapsLoadingPromise) {
    return googleMapsLoadingPromise;
  }

  if ((window as any).google?.maps) {
    return Promise.resolve();
  }

  googleMapsLoadingPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById('google-maps-js');
    if (existingScript) {
      if ((window as any).google?.maps) {
        resolve();
      } else {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', () => reject(new Error('Google Maps script failed to load')));
      }
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-js';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`; 
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google Maps script failed to load'));
    document.head.appendChild(script);
  });

  return googleMapsLoadingPromise;
};