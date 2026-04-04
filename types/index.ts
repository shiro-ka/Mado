// Session types
export interface Session {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
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
  boxUri: string;        // AT-URI of the box: at://ownerDid/blue.mado.box/rkey
  encryptedFrom: string; // base64 ECIES-encrypted sender DID
  body: string;          // plaintext question text (public on PDS)
  senderDid?: string;    // decrypted sender DID (only visible to box owner)
  senderHandle?: string;
  senderDisplayName?: string;
  senderAvatar?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Answer {
  uri: string;
  cid: string;
  rkey: string;
  questionRkey: string;
  body: string;
  createdAt: string;
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
  encryptedFrom: string; // base64 ECIES-encrypted sender DID
  body: string;          // plaintext question text (public on PDS)
  box: string;           // AT-URI: at://ownerDid/blue.mado.box/rkey
  createdAt: string;
}

export interface BlueMadoAnswer {
  $type: "blue.mado.answer";
  koe: string;   // AT-URI of the question (blue.mado.koe record)
  body: string;
  createdAt: string;
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
