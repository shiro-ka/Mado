export const MAX_ACCOUNTS = 5;

export type ViewerSession = {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
};

export type AccountSummary = {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
  active: boolean;
};
