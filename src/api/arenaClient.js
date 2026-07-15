const accessToken = import.meta.env.VITE_ARENA_ACCESS_TOKEN;

const API_BASE_URL = "https://api.are.na/v3";
const CACHE_BUST_PARAM = "_cb";

const buildRequestConfig = () => {
  const headers = {
    Accept: "application/json",
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return {
    headers,
  };
};

const normaliseItems = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload?.data) {
    return Array.isArray(payload.data) ? payload.data : [];
  }

  if (payload?.channels?.length) {
    return payload.channels;
  }

  if (payload?.contents?.length) {
    return payload.contents;
  }

  if (payload?.blocks?.length) {
    return payload.blocks;
  }

  return [];
};

const fetchFromArena = async (endpoint, params = {}) => {
  const url = new URL(`${API_BASE_URL}/${endpoint}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString(), buildRequestConfig());

  if (!response.ok) {
    const message = `Are.na request to "${endpoint}" failed with status ${response.status}.`;
    throw new Error(message);
  }

  return response.json();
};

const fetchPaginated = async (
  endpoint,
  { params = {}, maxPages = 10, extract = normaliseItems } = {},
) => {
  const per = params.per ?? 50;
  const items = [];
  let page = 1;

  while (page <= maxPages) {
    const payload = await fetchFromArena(endpoint, {
      ...params,
      per,
      page,
    });

    const batch = extract(payload);

    if (!batch.length) {
      break;
    }

    items.push(...batch);

    const meta = payload?.meta;

    if (meta) {
      if (!meta.has_more_pages) {
        break;
      }
    } else if (batch.length < per) {
      break;
    }

    page += 1;
  }

  return items;
};

export const getChannelContents = async (slug, options = {}) => {
  if (!slug) {
    throw new Error("Channel slug is required to fetch contents.");
  }

  const { per = 12, page = 1, cacheBust = true, ...rest } = options;

  const params = {
    per,
    page,
    ...rest,
  };

  if (
    cacheBust &&
    (params[CACHE_BUST_PARAM] === undefined ||
      params[CACHE_BUST_PARAM] === null)
  ) {
    params[CACHE_BUST_PARAM] = Date.now();
  }

  const payload = await fetchFromArena(
    `channels/${encodeURIComponent(slug)}/contents`,
    params,
  );

  return normaliseItems(payload);
};

export const getChannel = async (slug) => {
  if (!slug) {
    throw new Error("Channel slug is required to fetch channel info.");
  }

  return fetchFromArena(`channels/${encodeURIComponent(slug)}`, {
    [CACHE_BUST_PARAM]: Date.now(),
  });
};

export const getGroupChannels = async (
  groupSlug,
  { per = 100, maxPages = 10 } = {},
) => {
  if (!groupSlug) {
    throw new Error("Group slug is required to fetch group channels.");
  }

  const slug = encodeURIComponent(groupSlug);

  return fetchPaginated(`groups/${slug}/contents`, {
    params: { per, type: "Channel", [CACHE_BUST_PARAM]: Date.now() },
    maxPages,
  });
};

export const getGroup = async (groupSlug) => {
  if (!groupSlug) {
    throw new Error("Group slug is required to fetch group info.");
  }

  return fetchFromArena(`groups/${encodeURIComponent(groupSlug)}`, {
    [CACHE_BUST_PARAM]: Date.now(),
  });
};

export const getGroupContents = async (
  groupSlug,
  { per = 50, maxPages = 10, type, sort } = {},
) => {
  if (!groupSlug) {
    throw new Error("Group slug is required to fetch group contents.");
  }

  const slug = encodeURIComponent(groupSlug);
  const params = { per, [CACHE_BUST_PARAM]: Date.now() };

  if (type) {
    params.type = type;
  }

  if (sort) {
    params.sort = sort;
  }

  return fetchPaginated(`groups/${slug}/contents`, {
    params,
    maxPages,
  });
};

const postToArena = async (endpoint, body = {}) => {
  const url = new URL(`${API_BASE_URL}/${endpoint}`);
  const config = buildRequestConfig();

  const response = await fetch(url.toString(), {
    ...config,
    method: "POST",
    headers: {
      ...config.headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let detail = "";
    try {
      const err = await response.json();
      detail = err.errors
        ? err.errors.map((e) => e.message).join("; ")
        : err.title || "";
    } catch {
      /* ignore parse failure */
    }
    throw new Error(
      `Are.na POST to "${endpoint}" failed (${response.status}). ${detail}`.trim(),
    );
  }

  return response.json();
};

const putToArena = async (endpoint, body = {}) => {
  const url = new URL(`${API_BASE_URL}/${endpoint}`);
  const config = buildRequestConfig();

  const response = await fetch(url.toString(), {
    ...config,
    method: "PUT",
    headers: {
      ...config.headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let detail = "";
    try {
      const err = await response.json();
      detail = err.errors
        ? err.errors.map((e) => e.message).join("; ")
        : err.title || "";
    } catch {
      /* ignore parse failure */
    }
    throw new Error(
      `Are.na PUT to "${endpoint}" failed (${response.status}). ${detail}`.trim(),
    );
  }

  return response.json();
};

const DEFAULT_GROUP_ID = 36176; // numan-studio group

export const createChannel = async (
  title,
  { groupId = DEFAULT_GROUP_ID, visibility = "private" } = {},
) => {
  if (!title) throw new Error("Channel title is required.");

  const body = { title, visibility };
  if (groupId) body.group_id = groupId;

  return postToArena("channels", body);
};

export const createBlock = async (channelId, { value, title } = {}) => {
  if (!channelId) throw new Error("Channel ID is required to create a block.");
  if (!value) throw new Error("Block value is required.");

  const body = { value, channel_ids: [channelId] };
  if (title) body.title = title;

  return postToArena("blocks", body);
};

export const updateBlock = async (
  blockId,
  { content, title, description } = {},
) => {
  if (!blockId) throw new Error("Block ID is required to update a block.");

  const body = {};
  if (content !== undefined) body.content = content;
  if (title !== undefined) body.title = title;
  if (description !== undefined) body.description = description;

  return putToArena(`blocks/${blockId}`, body);
};

const ARENA_S3_PUBLIC_BASE = "https://s3.amazonaws.com/arena_images-temp/";

// Request presigned S3 PUT URLs for one or more files via the V3 API.
// Docs: https://www.are.na/developers/explore/upload/post-presign
export const getPresignedUploads = async (files) => {
  const payload = files.map((file) => ({
    filename: file.name,
    content_type: file.type || "application/octet-stream",
  }));

  const result = await postToArena("uploads/presign", { files: payload });

  if (!result?.files?.length) {
    throw new Error("Are.na presign response did not include any files.");
  }

  return result.files;
};

export const uploadFileToArena = async (file) => {
  const [presigned] = await getPresignedUploads([file]);

  if (!presigned?.upload_url) {
    throw new Error("Are.na did not return a presigned upload URL.");
  }

  // The Content-Type header on the PUT must match the validated content_type
  // returned by the presign endpoint, otherwise S3 rejects the signature.
  const contentType =
    presigned.content_type || file.type || "application/octet-stream";

  const s3Response = await fetch(presigned.upload_url, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
    },
    body: file,
  });

  if (!s3Response.ok) {
    throw new Error(`S3 upload failed (${s3Response.status}).`);
  }

  // Blocks are created with the public S3 URL built from the returned key.
  // The key can contain spaces/special characters from the original filename,
  // so each path segment must be encoded to produce a valid URI.
  const encodedKey = presigned.key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${ARENA_S3_PUBLIC_BASE}${encodedKey}`;
};

export const getGroupBlocks = async (
  groupSlug,
  {
    channelParams = { per: 50, maxPages: 5 },
    blockParams = { per: 12, page: 1 },
    includeChannelMeta = false,
  } = {},
) => {
  if (!groupSlug) {
    throw new Error("Group slug is required to fetch group blocks.");
  }

  const channels = await getGroupChannels(groupSlug, channelParams);

  if (!channels.length) {
    return [];
  }

  const results = await Promise.all(
    channels.map(async (channel) => {
      const contents = await getChannelContents(channel.slug, blockParams);

      if (!includeChannelMeta) {
        return contents;
      }

      return contents.map((block) => ({
        ...block,
        channel,
      }));
    }),
  );

  const flattened = results.flat();

  return flattened.sort((a, b) => {
    const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;

    return bDate - aDate;
  });
};
