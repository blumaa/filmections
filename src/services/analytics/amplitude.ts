import * as amplitude from "@amplitude/analytics-browser";

const AMPLITUDE_API_KEY = import.meta.env.VITE_AMPLITUDE_API_KEY as
  | string
  | undefined;

let isInitialized = false;

type ValidPropertyType =
  | number
  | string
  | boolean
  | Array<string | number>
  | { [key: string]: ValidPropertyType }
  | Array<{ [key: string]: ValidPropertyType }>;

export function initAnalytics() {
  if (!AMPLITUDE_API_KEY) {
    console.warn("Amplitude API key not configured");
    return;
  }

  if (isInitialized) {
    return;
  }

  amplitude.init(AMPLITUDE_API_KEY, {
    serverZone: "EU",
    autocapture: {
      attribution: true,
      pageViews: true,
      sessions: true,
    },
  });

  isInitialized = true;
}

export function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>,
) {
  if (!isInitialized) {
    return;
  }
  amplitude.track(eventName, properties);
}

export function identifyUser(
  userId: string,
  properties?: Record<string, ValidPropertyType>,
) {
  if (!isInitialized) {
    return;
  }

  amplitude.setUserId(userId);

  if (properties) {
    const identifyEvent = new amplitude.Identify();
    Object.entries(properties).forEach(([key, value]) => {
      identifyEvent.set(key, value);
    });
    amplitude.identify(identifyEvent);
  }
}
