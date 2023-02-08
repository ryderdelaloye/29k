import {
  Session,
  SessionMode,
  SessionType,
} from '../../../../../../shared/src/types/Session';
import {
  PersistedState,
  State as CurrentState,
  UserState as CurrentUserState,
} from '../state';

// Types as they were in v2
type V2PinnedSession = {
  id: string;
  expires: Date;
};

type V2CompletedSession = {
  id: Session['id'];
  hostId?: Session['hostId'];
  exerciseId: Session['exerciseId'];
  language: Session['language'];
  type: 'public' | 'private' | 'async';
  completedAt: Date;
};

export type V2UserState = {
  pinnedSessions?: Array<V2PinnedSession>;
  completedSessions?: Array<V2CompletedSession>;
  metricsUid?: string;
};

export type V2State = {
  userState: {[key: string]: V2UserState};
};

const migrateCompletedSessions = (
  completedSessions: V2CompletedSession[],
): CurrentUserState['completedSessions'] =>
  completedSessions.map(({type, ...rest}) => ({
    ...rest,
    type: type === 'async' ? SessionType.public : SessionType[type],
    mode: type === 'async' ? SessionMode.async : SessionMode.live,
  }));

const migrateUserState = async (
  userState: V2UserState,
): Promise<CurrentUserState> => {
  if (!userState.completedSessions) {
    return userState as CurrentUserState;
  }

  return {
    ...userState,
    completedSessions: await migrateCompletedSessions(
      userState.completedSessions,
    ),
  };
};

const migrateUserStates = async (
  userStates: V2State['userState'],
): Promise<CurrentState['userState']> => {
  const userState = await Promise.all(
    Object.entries(userStates).map(
      async ([userId, state]): Promise<[string, CurrentUserState]> => [
        userId,
        await migrateUserState(state),
      ],
    ),
  );

  return userState.reduce(
    (states, [userId, state]) => ({
      ...states,
      [userId]: state,
    }),
    {},
  );
};

export default async (state: V2State): Promise<PersistedState> => ({
  ...state,
  userState: await migrateUserStates(state.userState),
});
