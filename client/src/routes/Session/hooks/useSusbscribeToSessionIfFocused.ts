import {useEffect} from 'react';
import useSessionState from '../state/state';
import {Session} from '../../../../../shared/src/types/Session';
import useSessions from '../../../lib/sessions/hooks/useSessions';
import {useIsFocused, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {
  ModalStackProps,
  TabNavigatorProps,
} from '../../../lib/navigation/constants/routes';
import useSubscribeToSession from './useSubscribeToSession';

type Options = {exitOnEnded?: boolean};

const useSubscribeToSessionIfFocused = (
  sessionId: Session['id'],
  options?: Options,
) => {
  const {exitOnEnded = true} = options ?? {};
  const setSessionState = useSessionState(state => state.setSessionState);
  const setSession = useSessionState(state => state.setSession);
  const {fetchSessions} = useSessions();
  const subscribeToSession = useSubscribeToSession(sessionId);
  const isFocused = useIsFocused();

  const {navigate} =
    useNavigation<
      NativeStackNavigationProp<TabNavigatorProps & ModalStackProps>
    >();

  useEffect(() => {
    if (isFocused) {
      return subscribeToSession((sessionState, session) => {
        if (!sessionState || !session || (exitOnEnded && sessionState?.ended)) {
          fetchSessions();
          navigate('Sessions');
          navigate('SessionUnavailableModal');
          return;
        }

        setSession(session);
        setSessionState(sessionState);
      });
    }
  }, [
    isFocused,
    subscribeToSession,
    exitOnEnded,
    fetchSessions,
    navigate,
    setSessionState,
    setSession,
  ]);
};

export default useSubscribeToSessionIfFocused;
