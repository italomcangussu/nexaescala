// Barrel export file for backward compatibility
// All functions are re-exported from their respective domain modules

// Cache utilities
export { fetchWithCache, invalidateCache, invalidateCacheExact, clearAllCache } from './cache';

// Validation utilities
export {
    sanitizeFilterValue,
    validateString,
    validateProfileUpdates,
    validateServiceInput,
    validateColorHex,
    MAX_NAME_LENGTH,
    MAX_BIO_LENGTH,
    MAX_FIELD_LENGTH,
    ALLOWED_PROFILE_FIELDS
} from './validation';

// Profiles
export {
    getProfiles,
    getProfileById,
    searchProfiles,
    updateProfile,
    updatePushSubscription,
    getNotificationPreferences,
    updateNotificationPreferences
} from './profiles';

// Admin
export {
    getAdminStats,
    getAllUsers,
    updateUserAppRole,
    getAppLogs,
    createAppLog,
    deleteUserAccount
} from './admin';

// Groups
export {
    getUserGroups,
    createService,
    updateGroup,
    addGroupMember,
    getGroupMembers,
    removeGroupMember,
    canUserLeaveGroup,
    leaveGroup,
    updateMemberPersonalColor,
    markColorBannerSeen,
    deleteGroup,
    searchInstitutions,
    getAdminGroups,
    getRelatedGroups,
    addRelatedGroup,
    removeRelatedGroup,
    createServiceComplete,
    updateServiceComplete
} from './groups';
export type { CanLeaveGroupResult, CreateServicePayload } from './groups';

// Finance
export {
    getFinancialRecords,
    updateFinancialRecordPaidStatus,
    createFinancialRecord,
    getFinancialConfig,
    saveFinancialConfig
} from './finance';
export type { FinancialRecordWithGroup } from './finance';

// Notifications
export {
    getNotifications,
    markNotificationAsRead,
    createNotification,
    createNotificationsBulk,
    sendPushToUsers
} from './notifications';

// Chat
export {
    fetchGroupMessages,
    sendGroupMessage
} from './chat';

// Shifts
export {
    getMyShifts,
    getMemberAssignmentsForPeriod,
    getShifts,
    getAssignments,
    createShift,
    updateShift,
    deleteShift,
    publishShifts,
    getShiftPresets,
    createShiftPreset,
    updateShiftPreset,
    deleteShiftPreset,
    createShiftPresetsBulk,
    syncShiftPresets,
    generateShiftsForGroup,
    regenerateShiftsForMonth,
    saveDailyScale,
    revertDailyScaleToGeneral,
    getRelatedShiftsForDay,
    replicateScheduleToMonth,
    getAllUserAssignmentsAcrossGroups
} from './shifts';
export type { ReplicateScheduleOptions } from './shifts';

// Assignments
export {
    createAssignment,
    deleteAssignment,
    updateAssignment
} from './assignments';

// Exchanges
export {
    createShiftExchange,
    cancelShiftExchange,
    respondToShiftExchange,
    getShiftExchanges,
    getUserShiftExchanges,
    getServiceExchangeHistory,
    updateShiftExchangeStatus,
    executeExchangeTransaction,
    createShiftOffer,
    createShiftExchangeRequest,
    getMyPendingExchangeRequests,
    getAvailableShiftsForExchange,
    respondToExchangeRequest,
    getPendingActionableRequests,
    cancelExchangeRequest,
    getTradeHistory
} from './exchanges';
