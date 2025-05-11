export const Roles = {
  ADMIN: 'ADMIN',
  ENGINEER: 'ENGINEER',
  IT_STAFF: 'IT_STAFF',
  STANDARD: 'STANDARD',
  PHOTOGRAPHER: 'PHOTOGRAPHER'
} as const;

export type Role = typeof Roles[keyof typeof Roles];

export const AssetStatuses = {
  AVAILABLE: 'AVAILABLE',
  CHECKED_OUT: 'CHECKED_OUT',
  MAINTENANCE: 'MAINTENANCE',
  RETIRED: 'RETIRED',
  DEGRADED: 'DEGRADED',
  OFFLINE: 'OFFLINE'
} as const;

export type AssetStatus = typeof AssetStatuses[keyof typeof AssetStatuses];

export const AssetTypes = {
  CAMERA: 'CAMERA',
  SERVER: 'SERVER',
  COMPUTER: 'COMPUTER',
  MOBILE_UNIT: 'MOBILE_UNIT',
  CABLE: 'CABLE',
  ACCESSORY: 'ACCESSORY',
  AJA_IO: 'AJA_IO',
  OTHER: 'OTHER'
} as const;

export type AssetType = typeof AssetTypes[keyof typeof AssetTypes];

export const OSVersions = {
  WIN10: 'Windows 10',
  WIN11_21H2: 'Windows 11 21H2',
  WIN11_22H2: 'Windows 11 22H2',
  WIN11_23H2: 'Windows 11 23H2'
} as const;

export type OSVersion = typeof OSVersions[keyof typeof OSVersions];

export const AdobeVersions = {
  ADOBE_22: '22',
  ADOBE_24: '24'
} as const;

export type AdobeVersion = typeof AdobeVersions[keyof typeof AdobeVersions];

export const AJAVersions = {
  V16_2_3: '16.2.3',
  V16_2_6: '16.2.6',
  V17_1: '17.1'
} as const;

export type AJAVersion = typeof AJAVersions[keyof typeof AJAVersions]; 