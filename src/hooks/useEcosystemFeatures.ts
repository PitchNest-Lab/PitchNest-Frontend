import { useEffect, useState } from "react";
import { fetchDiscoverFeatures, type EcosystemFeatures } from "../api/discover";
import { SURFACE_VISIBILITY } from "../config/surfaceVisibility";

/** Server feature flags for ecosystem surfaces; everything off until loaded. */
export function useEcosystemFeatures(): EcosystemFeatures {
  const [features, setFeatures] = useState<EcosystemFeatures>({
    discoverEngagement: false,
    community: false,
    pitchArena: false,
  });
  useEffect(() => {
    if (!SURFACE_VISIBILITY.community && !SURFACE_VISIBILITY.pitchArena) return;
    let active = true;
    void fetchDiscoverFeatures().then((result) => {
      if (active) setFeatures(result);
    });
    return () => {
      active = false;
    };
  }, []);
  return {
    ...features,
    community: SURFACE_VISIBILITY.community && features.community,
    pitchArena: SURFACE_VISIBILITY.pitchArena && features.pitchArena,
  };
}
