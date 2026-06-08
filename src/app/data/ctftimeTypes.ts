export type CtftimeTeamProfile = {
  teamId: number;
  teamUrl: string;
  teamName?: string;
  country?: string;
  globalRank?: number | string | null;
  countryRank?: number | string | null;
  ratingPoints?: number | string | null;
  lastUpdated?: string;
  events: CtftimeEventResult[];
};

export type CtftimeEventResult = {
  eventName: string;
  eventSlug?: string;
  year?: number | string;
  place?: number | string | null;
  points?: number | string | null;
  team?: string;
  ctftimeUrl?: string;
};
