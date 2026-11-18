/**
 * Product surfaces temporarily hidden while PitchNest focuses on pitching,
 * practice and feedback. The pages and data remain in place; set a surface to
 * true here to restore its routes and navigation. Community and Pitch Arena
 * also need their backend feature flags enabled for full functionality.
 * Published business profile URLs stay available for intentional shares and
 * Opportunity Hub challenge entries; the directory itself is hidden.
 */
export const SURFACE_VISIBILITY = {
  discovery: false,
  community: false,
  pitchArena: false,
  businessWorkspace: false,
} as const;
