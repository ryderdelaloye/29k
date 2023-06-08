import dynamicLinks from '@react-native-firebase/dynamic-links';
import notifee, {
  EventDetail,
  EventType,
  InitialNotification,
} from '@notifee/react-native';
import {appendOrigin} from './utils/url';
import {NOTIFICATION_CHANNELS} from '../notifications/constants';
import {logEvent} from '../metrics';

const resolveNotificationUrl = async (
  source: InitialNotification | EventDetail | null,
): Promise<string | undefined> => {
  const url = source?.notification?.data?.url as string;
  if (url) {
    return appendOrigin(
      (await dynamicLinks().resolveLink(url)).url,
      'notification',
    );
  }
};

const sendMetricEvent = async (detail: EventDetail) => {
  const id = detail.notification?.id as string | undefined;
  const channelId = detail.notification?.data?.channelId as string | undefined;
  const contentId = (detail.notification?.data?.contentId as string) ?? '';

  if (id && channelId && contentId) {
    if (channelId === NOTIFICATION_CHANNELS.PRACTICE_REMINDERS) {
      logEvent('Press Reminder', {
        id,
        channelId,
        collectionId: contentId,
      });
    } else {
      logEvent('Press Reminder', {id, channelId, exerciseId: contentId});
    }
  }
};

export const getInitialURL = async () =>
  await resolveNotificationUrl(await notifee.getInitialNotification());

export const addEventListener = (handler: (url: string) => void) =>
  notifee.onForegroundEvent(async ({type, detail}) => {
    if (type === EventType.PRESS) {
      sendMetricEvent(detail);
      const url = await resolveNotificationUrl(detail);
      if (url) {
        handler(url);
      }
    }
  });
