import { createItem, Item } from "./utils/tree";

const host = "https://europe-west1-slapstuk.cloudfunctions.net";
function get(verb: string, props: UrlProps) {
    return `${host}/${verb}?${formatProps(props)}`;
}

export type PageInfo = {
    totalResults: number;
    resultsPerPage: number;
    nextPageToken?: string;
};
export type MyResponse = {
    items: Item[];
    pageInfo: PageInfo;
};
export async function findPlaylistVideos(
    playlistId: string,
    pageToken?: string
): Promise<MyResponse> {
    const props = { playlistId, pageToken };
    const res = await fetch(get("getPlaylistItems", props));
    const json = await res.json();

    const items: any[] = json.items;
    return {
        items: items.map((item) => mapYoutubeItem(item)),
        pageInfo: { ...json.pageInfo, nextPageToken: json.nextPageToken },
    };
}

export async function getChannelInfo(
    channelId: string,
    pageToken?: string
): Promise<MyResponse> {
    const channelVideosUrl = get("getChannelVideos", { channelId });
    const channelPlaylistsUrl = get("getChannelPlaylists", {
        channelId,
        pageToken,
    });

    const [videosResponse, playlistsReponse] = await Promise.all([
        pageToken ? Promise.resolve(undefined) : fetch(channelVideosUrl),
        fetch(channelPlaylistsUrl),
    ]);

    const videosInfo = videosResponse ? await videosResponse.json() : {};
    const playlistsJson = await playlistsReponse.json();

    const items = (playlistsJson.items as any[]).map((item) =>
        mapYoutubeItem(item)
    );

    if (videosInfo.playlistId) {
        const all = createItem("yt-playlist", "All videos");
        all.itemId = videosInfo.playlistId;

        items.unshift(all);
    }

    return {
        items,
        pageInfo: {
            ...playlistsJson.pageInfo,
            nextPageToken: playlistsJson.nextPageToken,
        },
    };
}

export async function searchYoutube(
    term: string,
    pageToken?: string
): Promise<MyResponse> {
    const res = await fetch(get("getVideos", { q: term, pageToken }));
    const json = await res.json();
    return {
        items: (json.items as any[]).map((item) => mapYoutubeItem(item)),
        pageInfo: { ...json.pageInfo, nextPageToken: json.nextPageToken },
    };
}

function mapYoutubeItem(item: any): Item {
    const type =
        item.itemType == "video"
            ? "yt-video"
            : item.itemType == "playlist"
              ? "yt-playlist"
              : "yt-channel";

    const res = createItem(type, item.name);

    res.itemId = item.itemId;
    res.ytChannelId = item.channelId;
    res.ytChannelTitle = item.channelTitle;

    return res;
}

type UrlProps = Record<string, string | undefined>;
function formatProps(props: UrlProps) {
    return Object.keys(props)
        .filter((key) => typeof props[key] != "undefined")
        .map((key) => `${key}=${props[key]}`)
        .join("&");
}

// https://europe-west1-slapstuk.cloudfunctions.net/getVideos?q=deep%20house
// https://europe-west1-slapstuk.cloudfunctions.net/getChannelVideos?channelId=UCCWHSZ6VQPr7cnJAF8JbDzA
// https://europe-west1-slapstuk.cloudfunctions.net/getChannelPlaylists?part=snippet&channelId=UCCWHSZ6VQPr7cnJAF8JbDzA
