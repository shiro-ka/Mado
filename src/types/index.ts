export interface Session {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
}

export interface QuestionBox {
  uri: string;
  cid: string;
  rkey: string;
  slug: string;
  title: string;
  description?: string;
  isOpen: boolean;
  createdAt: string;
  ownerDid: string;
  ownerHandle?: string;
}

export interface Question {
  uri: string;
  cid: string;
  rkey: string;
  boxUri: string;
  body: string;
  senderDid?: string;
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

export interface BlueMadoBox {
  $type: "blue.mado.box";
  slug: string;
  title: string;
  description?: string;
  isOpen: boolean;
  createdAt: string;
}

export interface BlueMadoKoe {
  $type: "blue.mado.koe";
  body: string;
  box: string;
  createdAt: string;
}

export interface BlueMadoAnswer {
  $type: "blue.mado.answer";
  koe: string;
  body: string;
  createdAt: string;
}

export interface SentRef {
  ownerDid: string;
  koeRkey: string;
  boxRkey: string | null;
  sentAt: string;
  body: string;
  readAt: string | null;
}

export type SentItem = {
  ownerDid: string;
  koeRkey: string;
  body: string;
  sentAt: string;
  href?: string;
  boxTitle?: string;
  ownerHandle?: string;
  ownerDisplayName?: string;
  ownerAvatar?: string;
  answers: string[];
  hasNewAnswer: boolean;
};

export interface ApiError {
  error: string;
  message?: string;
}

export type FilterTab = "new" | "heard" | "all";

export type InboxItem = Question & {
  href: string;
  boxTitle?: string;
  answers: string[];
  senderHandle?: string;
  senderDisplayName?: string;
  senderAvatar?: string;
};
