// src/lib/dataSyncEventBus.ts
// Universal Reactive Event Bus & Cross-View Synchronization Engine
// 1. Supports 'kps-data-sync-event' across 6 typed domain scopes:
//    attendance, grading, exams, lesson_plans, messaging, academic
// 2. 100% backward compatibility with legacy custom events (kps-academic-calendar-updated, etc.)
// 3. Optimistic updates helper pattern with automatic state rollback on failure
// 4. Safe dual-mode execution (Browser DOM CustomEvents + Headless Node.js memory bus)

import { useEffect, useRef, useState, useCallback, type DependencyList } from 'react';

// ==========================================
// 1. DOMAIN & ACTION TYPE DEFINITIONS
// ==========================================

export type DataSyncDomain =
  | 'attendance'
  | 'grading'
  | 'exams'
  | 'lesson_plans'
  | 'messaging'
  | 'academic';

export type DataSyncAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'transfer'
  | 'rollback';

export const DATA_SYNC_EVENT = 'kps-data-sync-event' as const;

export interface DataSyncEventPayload<T = unknown> {
  domain: DataSyncDomain;
  action: DataSyncAction;
  data: T;
  timestamp: string;
  entityId?: string;
  isOptimistic?: boolean;
  isRollback?: boolean;
  source?: 'client' | 'universal_adapter' | 'supabase_realtime' | 'legacy_bridge' | 'system';
  meta?: Record<string, unknown>;
}

export type DataSyncFilter = {
  domain?: DataSyncDomain | DataSyncDomain[];
  action?: DataSyncAction | DataSyncAction[];
  entityId?: string;
};

export type DataSyncFilterOrDomain =
  | DataSyncDomain
  | DataSyncDomain[]
  | DataSyncFilter
  | ((payload: DataSyncEventPayload) => boolean);

export type DataSyncSubscriber<T = unknown> = (payload: DataSyncEventPayload<T>) => void;

// ==========================================
// 2. LEGACY EVENTS REGISTRY & MAPPINGS
// ==========================================

export const LEGACY_EVENTS = {
  ACADEMIC_CALENDAR: 'kps-academic-calendar-updated',
  BELL_SCHEDULE: 'kps-bell-schedule-updated',
  SCHOOL_SETTINGS: 'kps-school-settings-updated',
  SMS_USERS: 'kps-sms-users-updated',
  SCHOOL_LEAVE: 'kps-school-leave-settings-updated',
  CHAT_GROUPS: 'kp-chat-updated',
  STUDENT_TRANSFERRED: 'kp-student-transferred',
  GRADING_QUEUE: 'kp-grading-queue-updated',
  BUNDLE_UPDATED: 'kp-bundle-updated',
  SGS_ROSTER: 'kp-sgs-roster-updated',
  COPILOT_UPDATED: 'kp-copilot-updated',
  TEACHER_BANNERS: 'kps-teacher-banners-updated',
  STUDENT_BANNERS: 'kps-student-banners-updated',
  TODO_UPDATED: 'kp-todo-updated',
} as const;

export interface DispatchOptions {
  legacyEvents?: string[];
  legacyDetail?: unknown;
  skipLegacy?: boolean;
  source?: 'client' | 'universal_adapter' | 'supabase_realtime' | 'legacy_bridge' | 'system';
}

// In-memory fallback listener registry for Node / headless environments
const nodeFallbackListeners = new Set<{
  filter?: DataSyncFilterOrDomain;
  callback: DataSyncSubscriber;
}>();

// ==========================================
// 3. CORE EVENT DISPATCH & SUBSCRIBE
// ==========================================

export function createDataSyncPayload<T>(
  domain: DataSyncDomain,
  action: DataSyncAction,
  data: T,
  extra?: Partial<DataSyncEventPayload<T>>
): DataSyncEventPayload<T> {
  return {
    domain,
    action,
    data,
    timestamp: new Date().toISOString(),
    source: 'client',
    ...extra,
  };
}

export function matchesFilter(
  payload: DataSyncEventPayload,
  filter?: DataSyncFilterOrDomain
): boolean {
  if (!filter) return true;
  if (typeof filter === 'function') {
    return filter(payload);
  }
  if (typeof filter === 'string') {
    return payload.domain === filter;
  }
  if (Array.isArray(filter)) {
    return filter.includes(payload.domain);
  }
  if (filter.domain) {
    const domains = Array.isArray(filter.domain) ? filter.domain : [filter.domain];
    if (!domains.includes(payload.domain)) return false;
  }
  if (filter.action) {
    const actions = Array.isArray(filter.action) ? filter.action : [filter.action];
    if (!actions.includes(payload.action)) return false;
  }
  if (filter.entityId && payload.entityId !== filter.entityId) {
    return false;
  }
  return true;
}

export function dispatchDataSyncEvent<T>(
  payload: DataSyncEventPayload<T>,
  options?: DispatchOptions
): void {
  // 1. Notify Node / in-memory fallback subscribers
  nodeFallbackListeners.forEach(({ filter, callback }) => {
    try {
      if (matchesFilter(payload as DataSyncEventPayload, filter)) {
        callback(payload as DataSyncEventPayload);
      }
    } catch (e) {
      console.warn('[dataSyncEventBus] Subscriber error:', e);
    }
  });

  // 2. Dispatch DOM CustomEvent if in browser environment
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    try {
      const customEvent = new CustomEvent(DATA_SYNC_EVENT, { detail: payload });
      window.dispatchEvent(customEvent);
    } catch {
      // In case CustomEvent constructor fails in archaic polyfill
      const evt = (document as any).createEvent?.('CustomEvent');
      if (evt) {
        evt.initCustomEvent(DATA_SYNC_EVENT, false, false, payload);
        window.dispatchEvent(evt);
      }
    }

    // 3. Automatic or explicit legacy event propagation
    if (!options?.skipLegacy) {
      propagateLegacyEvents(payload, options);
    }
  }
}

function propagateLegacyEvents<T>(
  payload: DataSyncEventPayload<T>,
  options?: DispatchOptions
): void {
  if (typeof window === 'undefined') return;

  const eventsToDispatch: { name: string; detail?: unknown }[] = [];

  // A. Explicit legacy events from options
  if (options?.legacyEvents && options.legacyEvents.length > 0) {
    options.legacyEvents.forEach((name) => {
      eventsToDispatch.push({ name, detail: options.legacyDetail ?? payload.data });
    });
  } else {
    // B. Heuristic automatic mapping based on domain & data shape
    const { domain, action, data } = payload;
    const d = data as any;

    if (domain === 'academic') {
      if (d && (d.morningAssemblyStart !== undefined || d.periodDurationMinutes !== undefined)) {
        eventsToDispatch.push({ name: LEGACY_EVENTS.BELL_SCHEDULE, detail: data });
      } else if (d && (d.terms !== undefined || d.holidays !== undefined)) {
        eventsToDispatch.push({ name: LEGACY_EVENTS.ACADEMIC_CALENDAR, detail: data });
      } else if (d && d.morningToClassSyncMode !== undefined) {
        eventsToDispatch.push({ name: LEGACY_EVENTS.SCHOOL_SETTINGS });
      }
    } else if (domain === 'messaging') {
      if (action === 'transfer') {
        eventsToDispatch.push({ name: LEGACY_EVENTS.STUDENT_TRANSFERRED, detail: data });
      } else {
        eventsToDispatch.push({ name: LEGACY_EVENTS.CHAT_GROUPS, detail: data });
      }
    } else if (domain === 'grading') {
      if (payload.meta?.type === 'bundle') {
        eventsToDispatch.push({ name: LEGACY_EVENTS.BUNDLE_UPDATED, detail: data });
      } else {
        eventsToDispatch.push({ name: LEGACY_EVENTS.GRADING_QUEUE, detail: data });
      }
    }
  }

  // Dispatch collected legacy events safely
  eventsToDispatch.forEach(({ name, detail }) => {
    try {
      if (detail !== undefined) {
        window.dispatchEvent(new CustomEvent(name, { detail }));
      } else {
        window.dispatchEvent(new Event(name));
      }
    } catch (e) {
      console.warn(`[dataSyncEventBus] Failed to dispatch legacy event ${name}:`, e);
    }
  });
}

export function subscribeDataSyncEvent<T = unknown>(
  filterOrDomain: DataSyncFilterOrDomain | undefined,
  callback: DataSyncSubscriber<T>
): () => void {
  const subscriberEntry = {
    filter: filterOrDomain,
    callback: callback as DataSyncSubscriber,
  };
  nodeFallbackListeners.add(subscriberEntry);

  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    const domHandler = (e: Event) => {
      const custom = e as CustomEvent<DataSyncEventPayload<T>>;
      if (custom.detail && matchesFilter(custom.detail as DataSyncEventPayload, filterOrDomain)) {
        callback(custom.detail);
      }
    };

    window.addEventListener(DATA_SYNC_EVENT, domHandler);

    return () => {
      nodeFallbackListeners.delete(subscriberEntry);
      window.removeEventListener(DATA_SYNC_EVENT, domHandler);
    };
  }

  return () => {
    nodeFallbackListeners.delete(subscriberEntry);
  };
}

// ==========================================
// 4. OPTIMISTIC UPDATE HELPER & ROLLBACK
// ==========================================

export interface OptimisticUpdateOptions<TData, TResult = unknown> {
  domain: DataSyncDomain;
  action?: DataSyncAction;
  entityId?: string;
  currentData: TData;
  optimisticData: TData;
  applyOptimistic: (data: TData) => void;
  mutationFn: () => Promise<TResult>;
  rollback?: (previousData: TData, error: unknown) => void;
  onSuccess?: (result: TResult, appliedData: TData) => void;
  onError?: (error: unknown, rolledBackData: TData) => void;
  legacyEvent?: string;
  throwOnError?: boolean;
  meta?: Record<string, unknown>;
}

export interface OptimisticUpdateResult<TResult, TData> {
  success: boolean;
  data?: TResult;
  error?: unknown;
  rolledBack: boolean;
  appliedData: TData;
}

export async function executeOptimisticUpdate<TData, TResult = unknown>(
  options: OptimisticUpdateOptions<TData, TResult>
): Promise<OptimisticUpdateResult<TResult, TData>> {
  const {
    domain,
    action = 'update',
    entityId,
    currentData,
    optimisticData,
    applyOptimistic,
    mutationFn,
    rollback,
    onSuccess,
    onError,
    legacyEvent,
    throwOnError = false,
    meta,
  } = options;

  // 1. Snapshot previous data
  const snapshotData = currentData;

  // 2. Instantly apply optimistic update locally
  applyOptimistic(optimisticData);

  // 3. Dispatch optimistic event on bus
  dispatchDataSyncEvent(
    createDataSyncPayload(domain, action, optimisticData, {
      entityId,
      isOptimistic: true,
      meta,
    }),
    { legacyEvents: legacyEvent ? [legacyEvent] : undefined }
  );

  try {
    // 4. Execute asynchronous mutation
    const result = await mutationFn();

    // 5. Success: broadcast confirmed state
    dispatchDataSyncEvent(
      createDataSyncPayload(domain, action, optimisticData, {
        entityId,
        isOptimistic: false,
        meta,
      }),
      { legacyEvents: legacyEvent ? [legacyEvent] : undefined }
    );

    if (onSuccess) {
      onSuccess(result, optimisticData);
    }

    return {
      success: true,
      data: result,
      rolledBack: false,
      appliedData: optimisticData,
    };
  } catch (error) {
    // 6. Failure: Automatically rollback to snapshot
    console.warn(`[dataSyncEventBus] Optimistic update failed on ${domain}. Rolling back:`, error);

    applyOptimistic(snapshotData);

    if (rollback) {
      rollback(snapshotData, error);
    }

    // 7. Dispatch rollback event
    dispatchDataSyncEvent(
      createDataSyncPayload(domain, 'rollback', snapshotData, {
        entityId,
        isRollback: true,
        isOptimistic: false,
        meta: { ...meta, error: String(error) },
      }),
      { legacyEvents: legacyEvent ? [legacyEvent] : undefined }
    );

    if (onError) {
      onError(error, snapshotData);
    }

    if (throwOnError) {
      throw error;
    }

    return {
      success: false,
      error,
      rolledBack: true,
      appliedData: snapshotData,
    };
  }
}

// ==========================================
// 5. REACT HOOKS
// ==========================================

export function useDataSyncListener<T = unknown>(
  filter: DataSyncFilterOrDomain | undefined,
  callback: DataSyncSubscriber<T>,
  deps: DependencyList = []
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const unsubscribe = subscribeDataSyncEvent<T>(filter, (payload) => {
      callbackRef.current(payload);
    });
    return unsubscribe;
  }, [JSON.stringify(filter), ...deps]);
}

export function useDataSyncTrigger(
  filter?: DataSyncFilterOrDomain
): number {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    return subscribeDataSyncEvent(filter, () => {
      setVersion((v) => v + 1);
    });
  }, [JSON.stringify(filter)]);

  return version;
}

export interface UseOptimisticMutationConfig<TData, TVariables = TData, TResult = unknown> {
  domain: DataSyncDomain;
  action?: DataSyncAction;
  applyOptimistic: (data: TData) => void;
  mutationFn: (variables: TVariables) => Promise<TResult>;
  toOptimisticData?: (variables: TVariables, current: TData) => TData;
  onSuccess?: (result: TResult, appliedData: TData) => void;
  onError?: (error: unknown, rolledBackData: TData) => void;
  legacyEvent?: string;
  meta?: Record<string, unknown>;
}

export function useOptimisticMutation<TData, TVariables = TData, TResult = unknown>(
  config: UseOptimisticMutationConfig<TData, TVariables, TResult>
) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<unknown | null>(null);

  const mutate = useCallback(
    async (variables: TVariables, currentSnapshot: TData) => {
      setIsPending(true);
      setError(null);

      const optimisticData = config.toOptimisticData
        ? config.toOptimisticData(variables, currentSnapshot)
        : (variables as unknown as TData);

      const result = await executeOptimisticUpdate<TData, TResult>({
        domain: config.domain,
        action: config.action ?? 'update',
        currentData: currentSnapshot,
        optimisticData,
        applyOptimistic: config.applyOptimistic,
        mutationFn: () => config.mutationFn(variables),
        legacyEvent: config.legacyEvent,
        meta: config.meta,
        onSuccess: (res, data) => {
          setIsPending(false);
          config.onSuccess?.(res, data);
        },
        onError: (err, data) => {
          setIsPending(false);
          setError(err);
          config.onError?.(err, data);
        },
      });

      setIsPending(false);
      return result;
    },
    [config]
  );

  const reset = useCallback(() => {
    setIsPending(false);
    setError(null);
  }, []);

  return { mutate, isPending, error, reset };
}
