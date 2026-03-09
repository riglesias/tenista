export interface TennisRating {
  value: number;
  level: string;
  description: string;
}

export const tennisRatings: TennisRating[] = [
  {
    value: 1.0,
    level: 'New Player',
    description: 'Just starting to play tennis.',
  },
  {
    value: 1.5,
    level: 'Beginner',
    description: 'Working primarily on getting the ball in play.',
  },
  {
    value: 2.0,
    level: 'Beginner',
    description: 'Knows all strokes but lacks court experience.',
  },
  {
    value: 2.5,
    level: 'Beginner Plus',
    description: 'Learning to judge where the ball is going. Starting to develop court coverage.',
  },
  {
    value: 3.0,
    level: 'Intermediate',
    description: 'Fairly consistent when hitting medium-paced shots. Most common doubles formation is one-up, one-back.',
  },
  {
    value: 3.5,
    level: 'Intermediate Plus',
    description: 'Improved stroke dependability with directional control on moderate shots. Developing teamwork in doubles.',
  },
  {
    value: 4.0,
    level: 'Advanced Intermediate',
    description: 'Dependable strokes, including directional control and depth on both forehand and backhand sides.',
  },
  {
    value: 4.5,
    level: 'Advanced',
    description: 'Starting to use power and spin. Beginning to handle pace. Sound footwork. Control of depth of shots.',
  },
  {
    value: 5.0,
    level: 'Advanced Plus',
    description: 'Good shot anticipation. Frequently have an outstanding shot. Can regularly hit winners.',
  },
  {
    value: 5.5,
    level: 'Elite',
    description: 'Highly skilled player with tournament experience. Potential college or professional level.',
  },
  {
    value: 6.0,
    level: 'Tournament Player',
    description: 'Has obtained a sectional and/or national ranking. Solid competitor at collegiate level.',
  },
  {
    value: 6.5,
    level: 'Elite Tournament Player',
    description: 'Has extensive satellite tournament experience. Potential for professional career.',
  },
  {
    value: 7.0,
    level: 'Professional',
    description: 'Current world-class player. Plays professionally.',
  },
];

export const getRatingInfo = (rating: number): TennisRating => {
  // Handle 5.0+ as elite players
  if (rating > 5.0) {
    return tennisRatings[tennisRatings.length - 1]; // Return the 5.5 "Elite" rating
  }
  return tennisRatings.find(r => r.value === rating) || tennisRatings[2]; // Default to 2.0
};

export const getRatingColor = (rating: number): string => {
  if (rating <= 2.5) return '#84cc16'; // Lime green for beginners
  if (rating <= 3.5) return '#3b82f6'; // Blue for intermediate
  if (rating <= 4.5) return '#f59e0b'; // Orange for advanced
  return '#ef4444'; // Red for advanced plus and elite
};

export const formatRating = (rating: number): string => {
  if (rating > 5.0) {
    return '+5.0';
  }
  return rating.toFixed(1);
};

// Browsable rating values (same cap as onboarding: 1.0–5.5)
export const BROWSABLE_RATING_VALUES = [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5];

/**
 * Get translated rating info using i18n `t` function from the 'common' namespace.
 * Falls back to the hardcoded English values if the key is missing.
 */
export const getRatingInfoTranslated = (
  rating: number,
  t: (key: string, options?: any) => string
): TennisRating => {
  const effectiveRating = rating > 5.0 ? 5.5 : rating;
  const key = effectiveRating.toFixed(1).replace('.', '_');
  const level = t(`ratings.levels.${key}.level`, { defaultValue: '' });
  const description = t(`ratings.levels.${key}.description`, { defaultValue: '' });

  // If translation exists, use it; otherwise fall back to getRatingInfo
  if (level && description) {
    return { value: effectiveRating, level, description };
  }
  return getRatingInfo(rating);
}; 