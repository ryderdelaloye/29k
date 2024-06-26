import {useCallback} from 'react';
import dayjs from 'dayjs';

import {NOTIFICATION_CHANNELS} from '../../notifications/constants';
import usePinnedCollections from '../../user/hooks/usePinnedCollections';
import useGetCollectionById from '../../content/hooks/useGetCollectionById';
import useUserEvents from '../../user/hooks/useUserEvents';
import useTriggerNotifications from '../../notifications/hooks/useTriggerNotifications';
import {calculateNextReminderTime} from '../utils/timeHelpers';
import {useTranslation} from 'react-i18next';
import useUserState, {
  PracticeReminderConfig,
  getCurrentUserStateSelector,
} from '../../user/state/state';
import {
  DEFAULT_NUMBER_OF_PRACTICE_REMINDERS,
  REMINDER_INTERVALS,
} from '../constants';
import useUser from '../../user/hooks/useUser';
import {CollectionWithLanguage} from '../../content/types';

const useUpdatePracticeReminders = () => {
  const {t} = useTranslation('Notification.PracticeReminder');
  const user = useUser();
  const {pinnedCollections} = usePinnedCollections();
  const {completedCollectionEvents} = useUserEvents();
  const getCollectionById = useGetCollectionById();
  const {removeTriggerNotifications, setTriggerNotification} =
    useTriggerNotifications();

  const resolveId = useCallback(
    (collection: CollectionWithLanguage | null, index: number) => {
      return collection
        ? t(`reminders.collection.${index}.id`)
        : t(`reminders.general.${index}.id`);
    },
    [t],
  );

  const resolveTitle = useCallback(
    (collection: CollectionWithLanguage | null, index: number) => {
      if (!user || !user.displayName) {
        return collection
          ? t(`reminders.collection.${index}.generic.title`, {
              collectionName: collection.name,
            })
          : t(`reminders.general.${index}.generic.title`);
      }
      return collection
        ? t(`reminders.collection.${index}.personal.title`, {
            collectionName: collection.name,
            userName: user.displayName,
          })
        : t(`reminders.general.${index}.personal.title`, {
            userName: user.displayName,
          });
    },
    [t, user],
  );

  const resolveBody = useCallback(
    (collection: CollectionWithLanguage | null, index: number) => {
      if (!user || !user.displayName) {
        return collection
          ? t(`reminders.collection.${index}.generic.body`, {
              collectionName: collection.name,
            })
          : t(`reminders.general.${index}.generic.body`);
      }
      return collection
        ? t(`reminders.collection.${index}.personal.body`, {
            collectionName: collection.name,
            userName: user.displayName,
          })
        : t(`reminders.general.${index}.personal.body`, {
            userName: user.displayName,
          });
    },
    [t, user],
  );

  const reCreateNotifications = useCallback(
    async (
      collection: CollectionWithLanguage | null,
      config?: PracticeReminderConfig | null,
    ) => {
      await removeTriggerNotifications(
        NOTIFICATION_CHANNELS.PRACTICE_REMINDERS,
      );
      if (config) {
        const nextReminderTime = calculateNextReminderTime(
          dayjs().utc(),
          config,
        );
        for (
          let index = 0;
          index < DEFAULT_NUMBER_OF_PRACTICE_REMINDERS;
          index++
        ) {
          await setTriggerNotification(
            resolveId(collection, index),
            NOTIFICATION_CHANNELS.PRACTICE_REMINDERS,
            collection?.id,
            resolveTitle(collection, index),
            resolveBody(collection, index),
            collection?.link,
            undefined,
            nextReminderTime
              .add(
                index,
                config.interval === REMINDER_INTERVALS.DAILY ? 'day' : 'week',
              )
              .valueOf(),
          );
        }
      }
    },
    [
      removeTriggerNotifications,
      setTriggerNotification,
      resolveId,
      resolveTitle,
      resolveBody,
    ],
  );

  const updatePracticeNotifications = useCallback(
    async (config?: PracticeReminderConfig | null) => {
      const pinnedCollection = pinnedCollections
        .sort(
          (a, b) =>
            new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
        )
        .find(
          c =>
            !completedCollectionEvents.find(
              cc =>
                cc.payload.id === c.id &&
                dayjs(c.startedAt).isBefore(cc.timestamp),
            ),
        );

      const collection = pinnedCollection
        ? getCollectionById(pinnedCollection.id)
        : null;

      const practiceReminderConfig = getCurrentUserStateSelector(
        useUserState.getState(),
      )?.practiceReminderConfig;

      await reCreateNotifications(collection, config ?? practiceReminderConfig);
    },
    [
      completedCollectionEvents,
      pinnedCollections,
      getCollectionById,
      reCreateNotifications,
    ],
  );

  return {
    updatePracticeNotifications,
  };
};

export default useUpdatePracticeReminders;
