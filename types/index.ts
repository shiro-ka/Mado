// Session types
export interface Session {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
  accessJwt?: string;
  refreshJwt?: string;
  expiresAt?: number;
}

export interface StoredTokens {
  accessJwt: string;
  refreshJwt: string;
  expiresAt: number;
}

// Question box types
export interface QuestionBox {
  uri: string;
  cid: string;
  rkey: string;
  slug: string;
  title: string;
  description?: string;
  isOpen: boolean;
  publicKeyHex: string;
  createdAt: string;
  ownerDid: string;
  ownerHandle?: string;
}

// Question (koe = 声) types
export interface Question {
  uri: string;
  cid: string;
  rkey: string;
  boxRkey: string;
  encryptedPayload: string;
  senderDid?: string;
  senderHandle?: string;
  senderDisplayName?: string;
  senderAvatar?: string;
  isRead: boolean;
  createdAt: string;
  // Decrypted fields (only available to box owner)
  body?: string;
}

export interface Answer {
  uri: string;
  cid: string;
  rkey: string;
  questionRkey: string;
  body: string;
  createdAt: string;
}

export interface BlockedUser {
  did: string;
  handle: string;
  blockedAt: string;
}

// ATProtocol Lexicon record types
export interface BlueMadoBox {
  $type: "blue.mado.box";
  slug: string;
  title: string;
  description?: string;
  isOpen: boolean;
  publicKeyHex: string;
  createdAt: string;
}

export interface BlueMadoKoe {
  $type: "blue.mado.koe";
  boxOwnerDid: string;
  boxRkey: string;
  encryptedPayload: string; // base64 encoded
  createdAt: string;
}

export interface BlueMadoAnswer {
  $type: "blue.mado.answer";
  koeUri: string;
  body: string;
  createdAt: string;
}

// Decrypted question payload
export interface QuestionPayload {
  from: string; // sender DID
  body: string; // question text
}

// API response types
export interface ApiError {
  error: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  cursor?: string;
  hasMore: boolean;
}

// UI state types
export type FilterTab = "unread" | "read" | "all";
