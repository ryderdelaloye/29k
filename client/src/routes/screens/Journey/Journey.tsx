import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  SectionList as RNSectionList,
  RefreshControl,
  SectionListRenderItem,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import styled from 'styled-components/native';
import dayjs from 'dayjs';
import {useNavigation, useScrollToTop} from '@react-navigation/native';
import {partition, groupBy, findLastIndex} from 'ramda';

import {JourneyItem} from './types/JourneyItem';

import {
  ModalStackProps,
  OverlayStackProps,
} from '../../../lib/navigation/constants/routes';
import {SPACINGS} from '../../../lib/constants/spacings';
import {COLORS} from '../../../../../shared/src/constants/colors';
import {HEIGHT as PLANNED_SESSION_HEIGHT} from '../../../lib/components/Cards/Card';

import useSessions from '../../../lib/sessions/hooks/useSessions';
import useCompletedSessions from '../../../lib/sessions/hooks/useCompletedSessions';
import usePinnedCollections from '../../../lib/user/hooks/usePinnedCollections';
import useUserEvents from '../../../lib/user/hooks/useUserEvents';

import {
  Spacer16,
  Spacer24,
  Spacer28,
  Spacer48,
  TopSafeArea,
} from '../../../lib/components/Spacers/Spacer';
import Gutters from '../../../lib/components/Gutters/Gutters';
import Screen from '../../../lib/components/Screen/Screen';
import {Heading16} from '../../../lib/components/Typography/Heading/Heading';
import SessionCard from '../../../lib/components/Cards/SessionCard/SessionCard';
import {Display24} from '../../../lib/components/Typography/Display/Display';
import StickyHeading, {
  HEIGHT as HEADER_HEIGHT,
} from '../../../lib/components/StickyHeading/StickyHeading';
import TopBar from '../../../lib/components/TopBar/TopBar';
import MiniProfile from '../../../lib/components/MiniProfile/MiniProfile';
import CollectionCardContainer from './components/CollectionCardContainer';
import BottomFade from '../../../lib/components/BottomFade/BottomFade';
import JourneyNode, {
  HEIGHT as JOURNEY_NODE_HEIGHT,
} from './components/JourneyNode';
import {ThumbsUpWithoutPadding} from '../../../lib/components/Thumbs/Thumbs';
import {LogoIcon} from '../../../lib/components/Icons';
import useUser from '../../../lib/user/hooks/useUser';
import Image from '../../../lib/components/Image/Image';
import SessionsStatus, {
  HEIGHT as FILTER_HEIGHT,
} from '../../../lib/components/SessionsStatus/SessionsStatus';
import getSectionListItemLayout from '../../../lib/utils/getSectionListItemLayout';
import {HEIGHT as COLLECTION_HEIGHT} from '../../../lib/components/Cards/CollectionCards/CollectionFullCard';

export type Section = {
  title: string;
  data: JourneyItem[];
  type:
    | 'plannedSessions'
    | 'completedSessions'
    | 'pinnedCollections'
    | 'filters';
};

const SectionList = styled(RNSectionList<JourneyItem, Section>)({
  flex: 1,
});

const Container = styled.View({
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
});

const Row = styled.View({
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
});

const ImageContainer = styled.View<{small?: boolean}>(() => ({
  backgroundColor: COLORS.GREYMEDIUM,
  width: SPACINGS.TWENTYFOUR,
  height: SPACINGS.TWENTYFOUR,
  borderRadius: SPACINGS.TWELVE,
  overflow: 'hidden',
  shadowColor: COLORS.GREYDARK,
}));

const renderSectionHeader: (info: {
  section: Section;
}) => React.ReactElement | null = ({section: {title}}) =>
  title ? (
    <StickyHeading backgroundColor={COLORS.PURE_WHITE}>
      <Heading16>{title}</Heading16>
    </StickyHeading>
  ) : null;

const getItemLayout = getSectionListItemLayout<JourneyItem, Section>({
  getItemHeight: item => {
    switch (item?.type) {
      case 'completedSession':
        return JOURNEY_NODE_HEIGHT;
      case 'filter':
        return FILTER_HEIGHT + SPACINGS.TWENTYEIGHT;
      case 'pinnedCollection':
        return COLLECTION_HEIGHT + SPACINGS.SIXTEEN;
      case 'plannedSession':
        return PLANNED_SESSION_HEIGHT + SPACINGS.SIXTEEN;
      default:
        return 0;
    }
  },
  getSectionHeaderHeight: section => (section?.title ? HEADER_HEIGHT : 0),
  listHeaderHeight: () => SPACINGS.TWENTYFOUR,
});

const Journey = () => {
  const {t} = useTranslation('Screen.Journey');
  const {navigate} =
    useNavigation<
      NativeStackNavigationProp<OverlayStackProps & ModalStackProps>
    >();
  const {fetchSessions, pinnedSessions, hostedSessions} = useSessions();
  const {completedSessions, completedHostedSessions} = useCompletedSessions();
  const {pinnedCollections} = usePinnedCollections();
  const [isLoading, setIsLoading] = useState(false);
  const listRef = useRef<RNSectionList<JourneyItem, Section>>(null);
  const filtersScrollIndex = useRef({sectionIndex: 0, itemIndex: 0});
  const {feedbackEvents} = useUserEvents();
  const user = useUser();

  const [positiveFeedbacks] = useMemo(
    () => partition(f => f.payload.answer, feedbackEvents),
    [feedbackEvents],
  );

  const sections = useMemo(() => {
    let sectionsList: Section[] = [];

    if (completedSessions.length > 0) {
      Object.entries(
        groupBy(
          item => dayjs(item.timestamp).format('MMM, YYYY'),
          completedSessions,
        ),
      ).forEach(([month, items]) => {
        sectionsList.push({
          title: month,
          data: items.map(s => ({
            type: 'completedSession',
            data: s,
            id: s.payload.id,
          })),
          type: 'completedSessions',
        });
      });

      sectionsList.push({
        title: '',
        data: [{id: 'completed-sessions-filter', type: 'filter'}],
        type: 'filters',
      });
    }

    if (pinnedCollections.length > 0) {
      sectionsList.push({
        title: t('headings.collections'),
        data: pinnedCollections.map(s => ({
          data: s,
          id: s.id,
          type: 'pinnedCollection',
        })),
        type: 'pinnedCollections',
      });
    }

    if (hostedSessions.length > 0 || pinnedSessions.length > 0) {
      sectionsList.push({
        title: t('headings.planned'),
        data: [...hostedSessions, ...pinnedSessions]
          .sort((a, b) =>
            dayjs(a.startTime).isBefore(dayjs(b.startTime)) ? -1 : 1,
          )
          .map(s => ({
            id: s.id,
            data: s,
            type: 'plannedSession',
          })),
        type: 'plannedSessions',
      });
    }

    const filtersSectionIndex = findLastIndex(
      ({type}) => type === 'filters',
      sectionsList,
    );

    filtersScrollIndex.current =
      filtersSectionIndex > -1
        ? {
            sectionIndex: filtersSectionIndex,
            itemIndex: 0,
          }
        : {sectionIndex: 0, itemIndex: 0};

    return sectionsList;
  }, [pinnedSessions, hostedSessions, completedSessions, pinnedCollections, t]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const onPositivePress = useCallback(
    () => navigate('CompletedSessionsModal', {filterSetting: 'feedback'}),
    [navigate],
  );

  const onTotalPress = useCallback(
    () => navigate('CompletedSessionsModal', {filterSetting: 'mode'}),
    [navigate],
  );

  const onHostedPress = useCallback(
    () => navigate('CompletedSessionsModal', {filterSetting: 'host'}),
    [navigate],
  );

  const UserPic = useCallback(
    () => (
      <ImageContainer>
        {user?.photoURL && <Image source={{uri: user.photoURL}} />}
      </ImageContainer>
    ),
    [user],
  );

  const refreshPull = useCallback(async () => {
    try {
      setIsLoading(true);
      await fetchSessions();
      setIsLoading(false);
    } catch (e: any) {
      setIsLoading(false);
      throw e;
    }
  }, [setIsLoading, fetchSessions]);

  const onPressEllipsis = useCallback(() => {
    navigate('AboutOverlay');
  }, [navigate]);

  const scrollToFiltersSection = useCallback((animated = false) => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToLocation({
        ...filtersScrollIndex.current,
        viewOffset: -(FILTER_HEIGHT / 2),
        viewPosition: 0.5, // Center of the screen
        animated,
      });
    });
  }, []);

  useEffect(scrollToFiltersSection, [scrollToFiltersSection, sections]);

  useScrollToTop(
    useRef({
      scrollToTop: () => scrollToFiltersSection(true),
    }),
  );

  const renderSession = useCallback<
    SectionListRenderItem<JourneyItem, Section>
  >(
    ({section, item, index}) => {
      switch (item.type) {
        case 'completedSession':
          return (
            <Gutters>
              <JourneyNode
                completedSessionEvent={item.data}
                isLast={index === section.data.length - 1}
              />
            </Gutters>
          );

        case 'filter':
          return (
            <Gutters>
              <Row>
                <SessionsStatus
                  onPress={onTotalPress}
                  Icon={LogoIcon}
                  heading={`${completedSessions.length}`}
                  description={t('totalSessions')}
                />
                {positiveFeedbacks.length && (
                  <>
                    <Spacer16 />
                    <SessionsStatus
                      onPress={onPositivePress}
                      Icon={ThumbsUpWithoutPadding}
                      heading={`${positiveFeedbacks.length}`}
                      description={t('meaninfulSessions')}
                    />
                  </>
                )}
                {completedHostedSessions.length && (
                  <>
                    <Spacer16 />
                    <SessionsStatus
                      onPress={onHostedPress}
                      Icon={UserPic}
                      heading={`${completedHostedSessions.length}`}
                      description={t('hostedSessions')}
                    />
                  </>
                )}
              </Row>
              <Spacer28 />
            </Gutters>
          );

        case 'pinnedCollection':
          return (
            <Gutters>
              <CollectionCardContainer collectionId={item.id} />
              <Spacer16 />
            </Gutters>
          );

        case 'plannedSession':
          return (
            <Gutters>
              <SessionCard session={item.data} />
              <Spacer16 />
            </Gutters>
          );
      }
    },
    [
      positiveFeedbacks.length,
      completedSessions,
      completedHostedSessions.length,
      onTotalPress,
      onHostedPress,
      onPositivePress,
      t,
      UserPic,
    ],
  );

  if (!sections.length) {
    return (
      <Screen backgroundColor={COLORS.GREYLIGHTEST}>
        <TopSafeArea minSize={SPACINGS.SIXTEEN} />
        <TopBar
          backgroundColor={COLORS.GREYLIGHTEST}
          onPressEllipsis={onPressEllipsis}>
          <MiniProfile />
        </TopBar>
        <Container>
          <Display24>{t('fallback')}</Display24>
        </Container>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={COLORS.PURE_WHITE}>
      <TopSafeArea minSize={SPACINGS.SIXTEEN} />
      <TopBar
        backgroundColor={COLORS.PURE_WHITE}
        onPressEllipsis={onPressEllipsis}>
        <MiniProfile />
      </TopBar>
      <SectionList
        ref={listRef}
        sections={sections}
        getItemLayout={getItemLayout}
        keyExtractor={session => session.id}
        ListHeaderComponent={Spacer24}
        ListFooterComponent={Spacer48}
        stickySectionHeadersEnabled
        renderSectionHeader={renderSectionHeader}
        renderItem={renderSession}
        initialNumToRender={5}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshPull} />
        }
      />
      <Spacer16 />
      <BottomFade />
    </Screen>
  );
};

export default Journey;
