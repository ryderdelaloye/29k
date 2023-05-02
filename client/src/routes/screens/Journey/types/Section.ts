import {LiveSessionType} from '../../../../../../shared/src/schemas/Session';
import {CompletedSessionEvent} from '../../../../../../shared/src/types/Event';
import {PinnedCollection} from '../../../../lib/user/state/state';

export type Section = {
  title: string;
  data: Item[];
  type:
    | 'plannedSessions'
    | 'completedSessions'
    | 'pinnedCollections'
    | 'filters';
};

export type Item =
  | CompletedSessionItem
  | FilterItem
  | PinnedCollectionItem
  | PlannedSessionItem;

type CompletedSessionItem = {
  id: string;
  type: 'completedSession';
  data: CompletedSessionEvent;
};

type FilterItem = {
  id: string;
  type: 'filter';
};

type PinnedCollectionItem = {
  id: string;
  type: 'pinnedCollection';
  data: PinnedCollection;
};

type PlannedSessionItem = {
  id: string;
  type: 'plannedSession';
  data: LiveSessionType;
};
