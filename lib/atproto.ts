import { AtpAgent } from "@atproto/api";
import type {
  BlueMadoBox,
  BlueMadoKoe,
  BlueMadoAnswer,
  QuestionBox,
  Question,
} from "@/types";

// Lexicon NSIDs
export const NSID = {
  BOX: "blue.mado.box",
  KOE: "blue.mado.koe",
  ANSWER: "blue.mado.answer",
} as const;

/**
 * Create an authenticated ATProto agent for a given user.
 */
function createAgent(serviceUrl?: string): AtpAgent {
  return new AtpAgent({ service: serviceUrl ?? "https://bsky.social" });
}

/**
 * Fetch a user's public profile from the Bluesky App View.
 */
export async function getProfile(handleOrDid: string) {
  const agent = createAgent();
  try {
    const res = await agent.getProfile({ actor: handleOrDid });
    return res.data;
  } catch {
    return null;
  }
}

/**
 * Resolve a handle to a DID.
 */
export async function resolveHandle(handle: string): Promise<string | null> {
  const agent = createAgent();
  try {
    const res = await agent.resolveHandle({ handle });
    return res.data.did;
  } catch {
    return null;
  }
}

/**
 * Get the service URL for a DID from the PLC directory.
 */
export async function getPdsUrl(did: string): Promise<string | null> {
  try {
    const res = await fetch(`https://plc.directory/${did}`);
    if (!res.ok) return null;
    const doc = await res.json() as {
      service?: Array<{ id: string; type: string; serviceEndpoint: string }>;
    };
    const pds = doc.service?.find((s) => s.id === "#atproto_pds");
    return pds?.serviceEndpoint ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch a single box record from a user's PDS.
 */
export async function getBoxRecord(
  did: string,
  rkey: string
): Promise<QuestionBox | null> {
  const agent = createAgent();
  try {
    const res = await agent.com.atproto.repo.getRecord({
      repo: did,
      collection: NSID.BOX,
      rkey,
    });

    const record = res.data.value as BlueMadoBox;
    return {
      uri: res.data.uri,
      cid: res.data.cid ?? "",
      rkey,
      slug: record.slug,
      title: record.title,
      description: record.description,
      isOpen: record.isOpen,
      publicKeyHex: record.publicKeyHex,
      createdAt: record.createdAt,
      ownerDid: did,
    };
  } catch {
    return null;
  }
}

/**
 * List all question boxes for a user.
 */
export async function listBoxes(did: string): Promise<QuestionBox[]> {
  const agent = createAgent();
  try {
    const res = await agent.com.atproto.repo.listRecords({
      repo: did,
      collection: NSID.BOX,
      limit: 100,
    });

    return res.data.records.map((r) => {
      const record = r.value as BlueMadoBox;
      const rkey = r.uri.split("/").pop() ?? "";
      return {
        uri: r.uri,
        cid: r.cid,
        rkey,
        slug: record.slug,
        title: record.title,
        description: record.description,
        isOpen: record.isOpen,
        publicKeyHex: record.publicKeyHex,
        createdAt: record.createdAt,
        ownerDid: did,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Find a box by its slug for a given user.
 */
export async function findBoxBySlug(
  did: string,
  slug: string
): Promise<QuestionBox | null> {
  const boxes = await listBoxes(did);
  return boxes.find((b) => b.slug === slug) ?? null;
}

/**
 * List all questions (koe records) in a user's box.
 */
export async function listQuestions(did: string): Promise<Question[]> {
  const agent = createAgent();
  try {
    const res = await agent.com.atproto.repo.listRecords({
      repo: did,
      collection: NSID.KOE,
      limit: 100,
    });

    return res.data.records.map((r) => {
      const record = r.value as BlueMadoKoe;
      const rkey = r.uri.split("/").pop() ?? "";
      return {
        uri: r.uri,
        cid: r.cid,
        rkey,
        boxRkey: record.boxRkey,
        encryptedPayload: record.encryptedPayload,
        isRead: false, // TODO: persist read status separately
        createdAt: record.createdAt,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Write a new question record to the box owner's PDS.
 * Uses the sender's access JWT to authenticate.
 */
export async function writeQuestion(params: {
  senderAccessJwt: string;
  senderDid: string;
  ownerDid: string;
  boxRkey: string;
  encryptedPayload: string; // base64
  pdsUrl?: string;
}): Promise<{ uri: string; cid: string } | null> {
  const { senderAccessJwt, ownerDid, boxRkey, encryptedPayload, pdsUrl } =
    params;

  const agent = createAgent(pdsUrl ?? "https://bsky.social");
  agent.session = {
    did: params.senderDid,
    handle: "",
    accessJwt: senderAccessJwt,
    refreshJwt: "",
    email: undefined,
    emailConfirmed: undefined,
    emailAuthFactor: undefined,
    active: true,
  };

  try {
    const record: BlueMadoKoe = {
      $type: NSID.KOE,
      boxOwnerDid: ownerDid,
      boxRkey,
      encryptedPayload,
      createdAt: new Date().toISOString(),
    };

    const res = await agent.com.atproto.repo.createRecord({
      repo: params.senderDid,
      collection: NSID.KOE,
      record,
    });

    return { uri: res.data.uri, cid: res.data.cid };
  } catch {
    return null;
  }
}

/**
 * Write an answer to a question.
 */
export async function writeAnswer(params: {
  ownerAccessJwt: string;
  ownerDid: string;
  koeUri: string;
  body: string;
  pdsUrl?: string;
}): Promise<{ uri: string; cid: string } | null> {
  const { ownerAccessJwt, ownerDid, koeUri, body, pdsUrl } = params;

  const agent = createAgent(pdsUrl ?? "https://bsky.social");
  agent.session = {
    did: ownerDid,
    handle: "",
    accessJwt: ownerAccessJwt,
    refreshJwt: "",
    email: undefined,
    emailConfirmed: undefined,
    emailAuthFactor: undefined,
    active: true,
  };

  try {
    const record: BlueMadoAnswer = {
      $type: NSID.ANSWER,
      koeUri,
      body,
      createdAt: new Date().toISOString(),
    };

    const res = await agent.com.atproto.repo.createRecord({
      repo: ownerDid,
      collection: NSID.ANSWER,
      record,
    });

    return { uri: res.data.uri, cid: res.data.cid };
  } catch {
    return null;
  }
}

/**
 * Delete a record from the user's PDS.
 */
export async function deleteRecord(params: {
  accessJwt: string;
  did: string;
  collection: string;
  rkey: string;
  pdsUrl?: string;
}): Promise<boolean> {
  const { accessJwt, did, collection, rkey, pdsUrl } = params;

  const agent = createAgent(pdsUrl ?? "https://bsky.social");
  agent.session = {
    did,
    handle: "",
    accessJwt,
    refreshJwt: "",
    email: undefined,
    emailConfirmed: undefined,
    emailAuthFactor: undefined,
    active: true,
  };

  try {
    await agent.com.atproto.repo.deleteRecord({
      repo: did,
      collection,
      rkey,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a box record on the user's PDS.
 */
export async function createBoxRecord(params: {
  accessJwt: string;
  did: string;
  slug: string;
  title: string;
  description?: string;
  isOpen: boolean;
  publicKeyHex: string;
  pdsUrl?: string;
}): Promise<{ uri: string; cid: string; rkey: string } | null> {
  const { accessJwt, did, slug, title, description, isOpen, publicKeyHex, pdsUrl } =
    params;

  const agent = createAgent(pdsUrl ?? "https://bsky.social");
  agent.session = {
    did,
    handle: "",
    accessJwt,
    refreshJwt: "",
    email: undefined,
    emailConfirmed: undefined,
    emailAuthFactor: undefined,
    active: true,
  };

  try {
    const record: BlueMadoBox = {
      $type: NSID.BOX,
      slug,
      title,
      description,
      isOpen,
      publicKeyHex,
      createdAt: new Date().toISOString(),
    };

    const res = await agent.com.atproto.repo.createRecord({
      repo: did,
      collection: NSID.BOX,
      record,
    });

    const rkey = res.data.uri.split("/").pop() ?? "";
    return { uri: res.data.uri, cid: res.data.cid, rkey };
  } catch {
    return null;
  }
}

/**
 * Update an existing box record on the user's PDS.
 */
export async function updateBoxRecord(params: {
  accessJwt: string;
  did: string;
  rkey: string;
  title: string;
  description?: string;
  isOpen: boolean;
  publicKeyHex: string;
  slug: string;
  pdsUrl?: string;
}): Promise<boolean> {
  const { accessJwt, did, rkey, title, description, isOpen, publicKeyHex, slug, pdsUrl } =
    params;

  const agent = createAgent(pdsUrl ?? "https://bsky.social");
  agent.session = {
    did,
    handle: "",
    accessJwt,
    refreshJwt: "",
    email: undefined,
    emailConfirmed: undefined,
    emailAuthFactor: undefined,
    active: true,
  };

  try {
    const record: BlueMadoBox = {
      $type: NSID.BOX,
      slug,
      title,
      description,
      isOpen,
      publicKeyHex,
      createdAt: new Date().toISOString(),
    };

    await agent.com.atproto.repo.putRecord({
      repo: did,
      collection: NSID.BOX,
      rkey,
      record,
    });

    return true;
  } catch {
    return false;
  }
}
