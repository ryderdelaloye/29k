import {uniq} from 'ramda';
import dayjs from 'dayjs';
import {useMemo} from 'react';
import useSessions from './useSessions';
import usePinnedCollections from '../../user/hooks/usePinnedCollections';
import useGetExercisesByCollectionId from '../../content/hooks/useGetExercisesByCollectionId';
import useExercises from '../../content/hooks/useExercises';
import useCompletedSessionByTime from '../../user/hooks/useCompletedSessionByTime';
import useGetStartedExercise from '../../content/hooks/useGetStartedExercise';
import useCompletedSessions from '../../user/hooks/useCompletedSessions';
import {ExerciseWithLanguage} from '../../content/types';

const useRecommendedSessions = () => {
  const {pinnedSessions, hostedSessions} = useSessions();
  const {pinnedCollections} = usePinnedCollections();
  const getExercisesByCollectionId = useGetExercisesByCollectionId();
  const {getCompletedSessionByExerciseId} = useCompletedSessionByTime();
  const allExercises = useExercises();
  const getStartedExercise = useGetStartedExercise();
  const {completedSessions} = useCompletedSessions();

  // Get started exercise if it hasn't been completed
  const recommendedExercises = useMemo(
    () =>
      getStartedExercise && !completedSessions.length
        ? [getStartedExercise]
        : [],
    [getStartedExercise, completedSessions.length],
  );

  // All pinned and hosted sessions
  const committedSessions = useMemo(
    () => uniq([...pinnedSessions, ...hostedSessions]),
    [pinnedSessions, hostedSessions],
  );

  // Split today and future sessions
  const sessionsToday = useMemo(
    () =>
      committedSessions.filter(session => dayjs(session.startTime).isToday()),
    [committedSessions],
  );

  // All incomplete sessions from pinned collections
  const collectionExercises = useMemo(
    () =>
      pinnedCollections.reduce<ExerciseWithLanguage[]>(
        (exercises, collection) => [
          ...exercises,
          ...getExercisesByCollectionId(collection.id)
            .filter(
              exercise =>
                // Filter out exercises that have been completed
                !getCompletedSessionByExerciseId(
                  exercise.id,
                  collection.startedAt,
                ),
            )
            .slice(0, 1), // Only return one exercise per collection
        ],
        [],
      ),
    [
      pinnedCollections,
      getExercisesByCollectionId,
      getCompletedSessionByExerciseId,
    ],
  );

  const randomExercises = useMemo(
    () =>
      allExercises
        .filter(exercise => exercise.id !== getStartedExercise?.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 5),
    [allExercises, getStartedExercise],
  );

  return useMemo(
    () =>
      uniq([
        ...sessionsToday,
        ...recommendedExercises,
        ...collectionExercises,
        ...randomExercises,
      ]).slice(0, 5), // Only five recommended sessions
    [sessionsToday, recommendedExercises, collectionExercises, randomExercises],
  );
};

export default useRecommendedSessions;
