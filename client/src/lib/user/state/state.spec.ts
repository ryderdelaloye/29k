import {FirebaseAuthTypes} from '@react-native-firebase/auth';
import {renderHook, act} from '@testing-library/react-hooks';
import {
  CompletedSessionPayload,
  PostPayload,
  UserEvent,
} from '../../../../../shared/src/types/Event';
import useUserState, {getCurrentUserStateSelector} from './state';
import {CollectionWithLanguage} from '../../content/types';

afterEach(() => {
  jest.useRealTimers();
});

describe('getCurrentUserStateSelector', () => {
  it('should return ephemeral state when user is null', () => {
    expect(
      getCurrentUserStateSelector({
        user: null,
        data: null,
        claims: {},
        userState: {
          'some-user-id': {
            metricsUid: 'some-metrics-uid',
          },
          ephemeral: {
            metricsUid: 'some-ephemeral-metrics-uid',
          },
        },
      }),
    ).toEqual({metricsUid: 'some-ephemeral-metrics-uid'});
  });

  it('should return current user state when user set', () => {
    expect(
      getCurrentUserStateSelector({
        user: {uid: 'some-user-id'} as FirebaseAuthTypes.User,
        data: null,
        claims: {},
        userState: {
          'some-user-id': {
            metricsUid: 'some-metrics-uid',
          },
          ephemeral: {
            metricsUid: 'some-ephemeral-metrics-uid',
          },
        },
      }),
    ).toEqual({metricsUid: 'some-metrics-uid'});
  });
});

describe('user - state', () => {
  describe('setUserAndClaims', () => {
    it('migrates the ephemeral user state to the user', () => {
      useUserState.setState({
        user: null,
        userState: {
          ephemeral: {
            metricsUid: 'some-metrics-uid',
          },
        },
      });

      const {result} = renderHook(() => useUserState());

      act(() => {
        result.current.setUserAndClaims({
          user: {uid: 'some-user-id'} as FirebaseAuthTypes.User,
          claims: {},
        });
      });

      expect(result.current.userState).toEqual({
        'some-user-id': {
          metricsUid: 'some-metrics-uid',
        },
      });
    });

    it('keeps the ephemeral state when user is set to null', () => {
      useUserState.setState({
        user: null,
        userState: {
          ephemeral: {
            metricsUid: 'some-metrics-uid',
          },
        },
      });

      const {result} = renderHook(() => useUserState());

      act(() => {
        result.current.setUserAndClaims({
          user: null,
          claims: {},
        });
      });

      expect(result.current.userState).toEqual({
        ephemeral: {
          metricsUid: 'some-metrics-uid',
        },
      });
    });
  });

  describe('setCurrentUserState', () => {
    it('sets an ephemeral user state when user is null', () => {
      useUserState.setState({
        user: null,
      });

      const {result} = renderHook(() => useUserState());

      act(() => {
        result.current.setCurrentUserState({
          metricsUid: 'some-metrics-uid',
        });
      });

      expect(result.current.userState).toEqual({
        ephemeral: {
          metricsUid: 'some-metrics-uid',
        },
      });
    });

    it('sets current user state when user is defined', () => {
      useUserState.setState({
        user: {uid: 'some-user-id'} as FirebaseAuthTypes.User,
      });

      const {result} = renderHook(() => useUserState());

      act(() => {
        result.current.setCurrentUserState({
          metricsUid: 'some-metrics-uid',
        });
      });

      expect(result.current.userState).toEqual({
        'some-user-id': {
          metricsUid: 'some-metrics-uid',
        },
      });
    });

    it('supports a setter function', () => {
      useUserState.setState({
        user: {uid: 'some-user-id'} as FirebaseAuthTypes.User,
      });

      const {result} = renderHook(() => useUserState());

      act(() => {
        result.current.setCurrentUserState(() => ({
          metricsUid: 'some-metrics-uid',
        }));
      });

      expect(result.current.userState).toEqual({
        'some-user-id': {
          metricsUid: 'some-metrics-uid',
        },
      });
    });
  });

  describe('setPinnedState', () => {
    it('should set pinned sessions on empty userState', () => {
      useUserState.setState({
        user: {uid: 'user-id'} as FirebaseAuthTypes.User,
        userState: {},
      });

      const {result} = renderHook(() => useUserState());

      act(() => {
        result.current.setPinnedSessions([
          {id: 'session-id', expires: new Date()},
        ]);
      });

      expect(result.current.userState['user-id'].pinnedSessions).toEqual([
        {id: 'session-id', expires: expect.any(Date)},
      ]);
    });

    it('should replace pinned sessions on existing userState', () => {
      useUserState.setState({
        user: {uid: 'user-id'} as FirebaseAuthTypes.User,
        userState: {
          'user-id': {
            pinnedSessions: [{id: 'other-session-id', expires: new Date()}],
          },
        },
      });

      const {result} = renderHook(() => useUserState());

      act(() => {
        result.current.setPinnedSessions([
          {id: 'session-id', expires: new Date()},
        ]);
      });

      expect(result.current.userState['user-id'].pinnedSessions).toEqual([
        {id: 'session-id', expires: expect.any(Date)},
      ]);
    });

    it('should keep other users state', () => {
      useUserState.setState({
        user: {uid: 'user-id'} as FirebaseAuthTypes.User,
        userState: {
          'user-id-2': {
            pinnedSessions: [{id: 'other-session-id', expires: new Date()}],
          },
        },
      });

      const {result} = renderHook(() => useUserState());

      act(() => {
        result.current.setPinnedSessions([
          {id: 'session-id', expires: new Date()},
        ]);
      });

      expect(result.current.userState['user-id'].pinnedSessions).toEqual([
        {id: 'session-id', expires: expect.any(Date)},
      ]);
      expect(result.current.userState['user-id-2'].pinnedSessions).toEqual([
        {id: 'other-session-id', expires: expect.any(Date)},
      ]);
    });
  });

  describe('addUserEvent', () => {
    it('should add post event to empty userState', () => {
      useUserState.setState({
        user: {uid: 'user-id'} as FirebaseAuthTypes.User,
        userState: {},
      });

      const {result} = renderHook(() => useUserState());

      act(() => {
        result.current.addUserEvent('post', {
          sessionId: 'some-session-id',
        } as PostPayload);
      });

      expect(result.current.userState['user-id'].userEvents).toEqual([
        {
          type: 'post',
          payload: {sessionId: 'some-session-id'},
          timestamp: expect.any(String),
        },
      ]);
    });

    it('should add post event on existing userState', () => {
      useUserState.setState({
        user: {uid: 'user-id'} as FirebaseAuthTypes.User,
        userState: {
          'user-id': {
            userEvents: [
              {
                type: 'post',
                payload: {sessionId: 'some-session-id'} as PostPayload,
                timestamp: new Date().toISOString(),
              },
            ],
          },
        },
      });

      const {result} = renderHook(() => useUserState());

      act(() => {
        result.current.addUserEvent('post', {
          sessionId: 'some-other-session-id',
        } as PostPayload);
      });

      expect(result.current.userState['user-id'].userEvents).toEqual([
        {
          type: 'post',
          payload: {sessionId: 'some-session-id'},
          timestamp: expect.any(String),
        },
        {
          type: 'post',
          payload: {sessionId: 'some-other-session-id'},
          timestamp: expect.any(String),
        },
      ]);
    });

    it('should keep other users state', () => {
      useUserState.setState({
        user: {uid: 'user-id'} as FirebaseAuthTypes.User,
        userState: {
          'user-id-2': {
            userEvents: [
              {
                type: 'post',
                payload: {sessionId: 'some-session-id'} as PostPayload,
                timestamp: new Date().toISOString(),
              },
            ],
          },
        },
      });

      const {result} = renderHook(() => useUserState());

      act(() => {
        result.current.addUserEvent('post', {
          sessionId: 'some-other-session-id',
        } as PostPayload);
      });

      expect(result.current.userState['user-id'].userEvents).toEqual([
        {
          type: 'post',
          payload: {sessionId: 'some-other-session-id'},
          timestamp: expect.any(String),
        },
      ]);
      expect(result.current.userState['user-id-2'].userEvents).toEqual([
        {
          type: 'post',
          payload: {sessionId: 'some-session-id'},
          timestamp: expect.any(String),
        },
      ]);
    });
  });

  describe('addCompletedSessionEvent', () => {
    it('should add completed session and completed collection', () => {
      jest.useFakeTimers().setSystemTime(new Date('2023-05-02T12:00:00Z'));
      useUserState.setState({
        user: {uid: 'user-id'} as FirebaseAuthTypes.User,
        userState: {
          'user-id': {
            pinnedCollections: [
              {id: 'some-collection-id', startedAt: '2023-05-02T10:00:00Z'},
            ],
            userEvents: [
              {
                type: 'completedSession',
                payload: {
                  exerciseId: 'other-exercise-id',
                } as CompletedSessionPayload,
                timestamp: '2023-05-02T11:00:00Z',
              },
              {
                type: 'completedSession',
                payload: {
                  exerciseId: 'exercise-id-1',
                } as CompletedSessionPayload,
                timestamp: '2023-05-02T11:00:00Z',
              },
              {
                type: 'completedSession',
                payload: {
                  exerciseId: 'exercise-id-2',
                } as CompletedSessionPayload,
                timestamp: '2023-05-02T12:00:00Z',
              },
            ],
          },
        },
      });

      const {result} = renderHook(() => useUserState());

      act(() => {
        result.current.addCompletedSessionEvent(
          {
            exerciseId: 'exercise-id-3',
          } as CompletedSessionPayload,
          [
            {
              id: 'some-collection-id',
              exercises: ['exercise-id-1', 'exercise-id-2', 'exercise-id-3'],
            } as CollectionWithLanguage,
          ],
        );
      });

      const userEvents = result.current.userState['user-id']
        .userEvents as Array<UserEvent>;
      expect(userEvents.length).toBe(5);
      expect(userEvents[3]).toEqual({
        type: 'completedSession',
        payload: {
          exerciseId: 'exercise-id-3',
        },
        timestamp: expect.any(String),
      });
      expect(userEvents[4]).toEqual({
        type: 'completedCollection',
        payload: {
          id: 'some-collection-id',
        },
        timestamp: expect.any(String),
      });
    });

    it('should add completed session and completed collection for all collections with exercise', () => {
      jest.useFakeTimers().setSystemTime(new Date('2023-05-02T12:00:00Z'));
      useUserState.setState({
        user: {uid: 'user-id'} as FirebaseAuthTypes.User,
        userState: {
          'user-id': {
            pinnedCollections: [
              {id: 'some-collection-id', startedAt: '2023-05-02T10:00:00Z'},
              {
                id: 'some-other-collection-id',
                startedAt: '2023-05-02T10:00:00Z',
              },
            ],
            userEvents: [
              {
                type: 'completedSession',
                payload: {
                  exerciseId: 'other-exercise-id',
                } as CompletedSessionPayload,
                timestamp: '2023-05-02T11:00:00Z',
              },
              {
                type: 'completedSession',
                payload: {
                  exerciseId: 'exercise-id-1',
                } as CompletedSessionPayload,
                timestamp: '2023-05-02T11:00:00Z',
              },
              {
                type: 'completedSession',
                payload: {
                  exerciseId: 'exercise-id-2',
                } as CompletedSessionPayload,
                timestamp: '2023-05-02T12:00:00Z',
              },
              {
                type: 'completedSession',
                payload: {
                  exerciseId: 'exercise-id-4',
                } as CompletedSessionPayload,
                timestamp: '2023-05-02T12:00:00Z',
              },
            ],
          },
        },
      });

      const {result} = renderHook(() => useUserState());

      act(() => {
        result.current.addCompletedSessionEvent(
          {
            exerciseId: 'exercise-id-3',
          } as CompletedSessionPayload,
          [
            {
              id: 'some-collection-id',
              exercises: ['exercise-id-1', 'exercise-id-2', 'exercise-id-3'],
            } as CollectionWithLanguage,
            {
              id: 'some-other-collection-id',
              exercises: ['exercise-id-3', 'exercise-id-4'],
            } as CollectionWithLanguage,
          ],
        );
      });

      const userEvents = result.current.userState['user-id']
        .userEvents as Array<UserEvent>;
      expect(userEvents.length).toBe(7);
      expect(userEvents[4]).toEqual({
        type: 'completedSession',
        payload: {
          exerciseId: 'exercise-id-3',
        },
        timestamp: expect.any(String),
      });
      expect(userEvents[5]).toEqual({
        type: 'completedCollection',
        payload: {
          id: 'some-collection-id',
        },
        timestamp: expect.any(String),
      });
      expect(userEvents[6]).toEqual({
        type: 'completedCollection',
        payload: {
          id: 'some-other-collection-id',
        },
        timestamp: expect.any(String),
      });
    });

    it('should not add completedCollection event when some sessions where completed before', () => {
      jest.useFakeTimers().setSystemTime(new Date('2023-05-02T12:00:00Z'));
      useUserState.setState({
        user: {uid: 'some-user-id'} as FirebaseAuthTypes.User,
        userState: {
          'some-user-id': {
            pinnedCollections: [
              {id: 'some-collection-id', startedAt: '2023-05-02T10:00:00Z'},
            ],
            userEvents: [
              {
                type: 'completedSession',
                payload: {
                  exerciseId: 'exercise-id-1',
                } as CompletedSessionPayload,
                timestamp: '2023-05-02T09:00:00Z',
              },
              {
                type: 'completedSession',
                payload: {
                  exerciseId: 'exercise-id-2',
                } as CompletedSessionPayload,
                timestamp: '2023-05-02T11:00:00Z',
              },
            ],
          },
        },
      });

      const {result} = renderHook(() => useUserState());

      act(() => {
        result.current.addCompletedSessionEvent(
          {
            exerciseId: 'exercise-id-3',
          } as CompletedSessionPayload,
          [
            {
              id: 'some-collection-id',
              exercises: ['exercise-id-1', 'exercise-id-2', 'exercise-id-3'],
            } as CollectionWithLanguage,
          ],
        );
      });

      const userEvents = result.current.userState['some-user-id']
        .userEvents as Array<UserEvent>;

      expect(userEvents.length).toBe(3);
      expect(userEvents[2]).toEqual({
        type: 'completedSession',
        payload: {exerciseId: 'exercise-id-3'},
        timestamp: expect.any(String),
      });
    });

    it('should not add completedCollection event when not all sessions where completed', () => {
      jest.useFakeTimers().setSystemTime(new Date('2023-05-02T12:00:00Z'));
      useUserState.setState({
        user: {uid: 'some-user-id'} as FirebaseAuthTypes.User,
        userState: {
          'some-user-id': {
            pinnedCollections: [
              {id: 'some-collection-id', startedAt: '2023-05-02T10:00:00Z'},
            ],
            userEvents: [
              {
                type: 'completedSession',
                payload: {
                  exerciseId: 'exercise-id-1',
                } as CompletedSessionPayload,
                timestamp: '2023-05-02T11:00:00Z',
              },
            ],
          },
        },
      });

      const {result} = renderHook(() => useUserState());

      act(() => {
        result.current.addCompletedSessionEvent(
          {
            exerciseId: 'exercise-id-2',
          } as CompletedSessionPayload,
          [
            {
              id: 'some-collection-id',
              exercises: ['exercise-id-1', 'exercise-id-2', 'exercise-id-3'],
            } as CollectionWithLanguage,
          ],
        );
      });

      const userEvents = result.current.userState['some-user-id']
        .userEvents as Array<UserEvent>;

      expect(userEvents.length).toBe(2);
      expect(userEvents[1]).toEqual({
        type: 'completedSession',
        payload: {exerciseId: 'exercise-id-2'},
        timestamp: expect.any(String),
      });
    });
  });

  describe('reset', () => {
    it('should keep current user and ephemeral state when not deleted', () => {
      useUserState.setState({
        user: {uid: 'user-id'} as FirebaseAuthTypes.User,
        userState: {
          ephemeral: {
            metricsUid: 'some-metrics-uid',
          },
          'user-id': {
            pinnedSessions: [{id: 'pinned-session-id', expires: new Date()}],
            userEvents: [
              {
                type: 'post',
                payload: {sessionId: 'some-session-id'} as PostPayload,
                timestamp: new Date().toISOString(),
              },
            ],
          },
        },
      });

      const {result} = renderHook(() => useUserState());

      act(() => {
        result.current.reset();
      });

      expect(result.current.userState).toEqual({
        ephemeral: {metricsUid: 'some-metrics-uid'},
        'user-id': {
          pinnedSessions: [
            {id: 'pinned-session-id', expires: expect.any(Date)},
          ],
          userEvents: [
            {
              type: 'post',
              timestamp: expect.any(String),
              payload: {sessionId: 'some-session-id'},
            },
          ],
        },
      });
    });

    it('should delete current user and ephemeral state only', () => {
      useUserState.setState({
        user: {uid: 'user-id'} as FirebaseAuthTypes.User,
        userState: {
          ephemeral: {
            metricsUid: 'some-metrics-uid',
          },
          'user-id': {
            pinnedSessions: [{id: 'pinned-session-id', expires: new Date()}],
            userEvents: [
              {
                type: 'post',
                payload: {sessionId: 'some-session-id'} as PostPayload,
                timestamp: new Date().toISOString(),
              },
            ],
          },
          'user-id-2': {
            pinnedSessions: [{id: 'pinned-session-id', expires: new Date()}],
            userEvents: [
              {
                type: 'post',
                payload: {sessionId: 'some-session-id'} as PostPayload,
                timestamp: new Date().toISOString(),
              },
            ],
          },
        },
      });

      const {result} = renderHook(() => useUserState());

      act(() => {
        result.current.reset(true);
      });

      expect(result.current.userState).toEqual({
        'user-id-2': {
          pinnedSessions: [
            {
              id: 'pinned-session-id',
              expires: expect.any(Date),
            },
          ],
          userEvents: [
            {
              type: 'post',
              timestamp: expect.any(String),
              payload: {sessionId: 'some-session-id'},
            },
          ],
        },
      });
    });
  });
});
