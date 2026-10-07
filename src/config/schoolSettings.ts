// src/config/schoolSettings.ts
// Re-export school branding & settings from schoolRoles for clean backwards compatibility

export {
  type SchoolBrandingSettings as SchoolSettingsConfig,
  type SchoolBrandingSettings,
  getSchoolSettings,
  KUTCHAP_SCHOOL_INFO,
} from './schoolRoles';
