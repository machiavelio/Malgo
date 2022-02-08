const clientSecret = "a09e3458367bbd5eccb06484fecbc5fa4069cfdd4efe9bb863fb242cd9fcd1a1";
const clientId = "d17aeabc292e2928d936f61d4d410fab";

import { AnimeList } from "../models/anime-list.model";
import { Anime } from "../models/anime.model";
import storage from "./storage-sync";

export async function initializeData(): Promise<void> {
  const { accessToken, refreshToken } = await storage.get(["accessToken", "refreshToken"]);

  if (!accessToken) {
    await storage.clear();

    return;
  }

  const { name: username } = await callApi("https://api.myanimelist.net/v2/users/@me");

  if (username) {
    await storage.set({ username });

    if ((await storage.get("animeList")).animeList) {
      saveAnimeList();
    } else {
      await saveAnimeList();
    }

    return;
  }

  const tokens = await callApi("https://myanimelist.net/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `grant_type=refresh_token&refresh_token=${refreshToken}&client_id=${clientId}&client_secret=${clientSecret}`,
  });

  if (tokens.access_token) {
    const { name } = await callApi("https://api.myanimelist.net/v2/users/@me");

    const saveTokens = {
      expiresAt: Date.now() + tokens.expires_in * 1000,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      username: name,
    };

    await storage.set(saveTokens);

    return;
  }

  await storage.clear();
}

export async function callApi(endpoint: string, init: RequestInit = {}): Promise<any> {
  const url = `https://malproxy.herokuapp.com/api/${init.method ?? "get"}/${endpoint}`;

  init.method = "POST";

  const { accessToken } = await storage.get("accessToken");
  init.headers = Object.assign(
    init.headers ?? {},
    accessToken ? { Authorization: `Bearer ${accessToken}` } : { "X-MAL-CLIENT-ID": clientId },
  );

  const rawResponse = await fetch(url, init);

  const response = await rawResponse.json();

  return response;
}

export async function callScrape(method: string, ...args: Array<string | number>): Promise<any> {
  const url = `https://malproxy.herokuapp.com/scrape/${method}/${args.join("&")}`;

  const rawResponse = await fetch(url, {
    method: "GET",
  });

  const response = await rawResponse.json();

  return response;
}

export async function saveAnimeList(): Promise<void> {
  const { username } = await storage.get("username");

  let rawList: Array<any> = [];

  for (let i = 0; ; i += 300) {
    const batch = await callScrape("getWatchListFromUser", username, i);
    rawList = rawList.concat(batch);

    if (batch.length < 300) {
      break;
    }
  }

  const animeList: Array<Anime> = rawList.map((anime: any) => {
    return {
      id: anime.animeId,
      status: anime.status,
      score: anime.score,
      name: anime.animeTitle,
      altName: anime.animeTitleEng,
      numOfEpisodes: anime.animeNumEpisodes,
      numOfEpisodesWatched: anime.numWatchedEpisodes,
    };
  });

  await storage.set({ animeList });
}

export async function getWatchingAnimeList(): Promise<any> {
  const { username } = await storage.get("username");

  const animeList = await callScrape("getWatchListFromUser", username);

  const response = animeList
    .filter((anime: any) => anime.status === 1)
    .map((anime: any) => {
      return {
        id: anime.animeId,
        name: anime.animeTitle,
        altName: anime.animeTitleEng,
        numOfEpisodes: anime.animeNumEpisodes,
        numOfEpisodesWatched: anime.numWatchedEpisodes,
      };
    });

  return response;
}

export async function getAnime(name: string): Promise<any> {
  const nameLimited = name.substring(0, 64);

  let response = await callApi(
    `https://api.myanimelist.net/v2/anime?q=${nameLimited}&limit=1&fields=mean,rank,popularity,alternative_titles,my_list_status,num_episodes`,
  );

  let anime = response.data?.[0]?.node;

  if (anime && (anime.title == name || anime.alternative_titles.en == name || anime.alternative_titles.ja == name)) {
    return anime;
  }

  response = await callApi(
    `https://api.myanimelist.net/v2/anime?q=${nameLimited}&limit=100&fields=mean,rank,popularity,alternative_titles,my_list_status,num_episodes`,
  );

  for (const item of response.data) {
    anime = item?.node;

    if (anime && (anime.title == name || anime.alternative_titles.en == name || anime.alternative_titles.ja == name)) {
      return anime;
    }
  }

  response = await callScrape("getInfoFromName", name);

  return response;
}

export async function updateAnime(anime: Anime): Promise<any> {
  const getStatus = (status: number) => {
    switch (status) {
      case 1:
        return "watching";

      case 2:
        return "completed";

      case 3:
        return "on_hold";

      case 4:
        return "dropped";

      case 6:
        return "plan_to_watch";

      default:
        return "watching";
    }
  };

  const score = anime.score;
  const num_watched_episodes = anime.numOfEpisodesWatched;
  const status = getStatus(anime.status);

  const response = await callApi(`https://api.myanimelist.net/v2/anime/${anime.id}/my_list_status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `status=${status}&score=${score}&num_watched_episodes=${num_watched_episodes}`,
  });

  return response;
}

export async function deleteAnime(animeId: number): Promise<any> {
  const response = await callApi(`https://api.myanimelist.net/v2/anime/${animeId}/my_list_status`, {
    method: "DELETE",
  });

  return response;
}
