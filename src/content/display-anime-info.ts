import { getAnime } from "../common/call-api";
import storage from "../common/storage-sync";
import { Anime } from "../models/anime.model";

export default async function initializeAnimeDetailsPageChanges(): Promise<void> {
  const domAnimeDetails = document.querySelector("div.anime_info_body_bg");
  const animeName = domAnimeDetails?.children[1].textContent as string;

  const animeList: Array<Anime> = (await storage.get("animeList")).animeList;

  if (domAnimeDetails) {
    const anime = await getAnime(animeName);
    applyAnimeInfo(domAnimeDetails as Element, anime);
  }

  function applyAnimeInfo(element: Element, anime: any) {
    (element as HTMLElement).style.position = "relative";
    const score = document.createElement("div");
    score.innerHTML = `
  <div title="Score according to MAL">Score: ${anime.mean ?? anime.score ?? "N/A"}</div>
  <div title="Top ranked according to MAL">Ranked: ${anime.rank ?? anime.ranked ?? "N/A"}</div>
  <div title="Top popularity according to MAL">Popularity: ${anime.popularity ?? "N/A"}</div>
  `;
    score.style.position = "absolute";
    score.style.top = "0";
    score.style.left = "2px";
    score.style.textAlign = "left";
    score.style.fontSize = "24px";
    score.style.fontFamily = "Helvetica";
    score.style.textShadow = "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000";
    score.style.color = "#fff";
    score.style.fontWeight = "bold";
    element.appendChild(score);

    if (animeList) {
      checkAnimeStatus(element, animeName);
    }
  }

  function checkAnimeStatus(element: Element, name: string) {
    const applyStatus = (status: string, color: string) => {
      const statusElement = document.createElement("div");
      statusElement.innerText = status;
      statusElement.style.color = color;
      statusElement.style.position = "absolute";
      statusElement.style.top = `${element.children[0].clientHeight - 30}px`;
      statusElement.style.left = "2px";
      statusElement.style.fontWeight = "bold";
      statusElement.style.fontSize = "22px";
      statusElement.style.fontFamily = "Helvetica";
      statusElement.style.textShadow = "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000";
      element.appendChild(statusElement);

      document.body.onresize = () => {
        statusElement.style.top = `${element.children[0].clientHeight - 30}px`;
      };
    };

    const anime = animeList.find((anime: Anime) => anime.name == name);

    if (anime?.status === 1) {
      applyStatus(`Watching (${anime.numOfEpisodesWatched}/${anime.numOfEpisodes || "?"})`, "#2db039");
    } else if (anime?.status === 4) {
      applyStatus(`Dropped (${anime.numOfEpisodesWatched}/${anime.numOfEpisodes || "?"})`, "#a12f31");
    } else if (anime?.status === 3) {
      applyStatus(`On Hold (${anime.numOfEpisodesWatched}/${anime.numOfEpisodes || "?"})`, "#f9d457");
    } else if (anime?.status === 6) {
      applyStatus(`To Watch (${anime.numOfEpisodes || "?"})`, "#c3c3c3");
    } else if (anime?.status === 2) {
      applyStatus(`Completed (${anime.numOfEpisodes})`, "#26448f");
    } else {
      applyStatus("Not Saved", "#fff");
    }
  }
}
