import { getAnime } from "../common/call-api";
import storage from "../common/storage-sync";
import { Anime } from "../models/anime.model";

export default async function initializeAnimeListPageChanges(): Promise<void> {
  const domAnimeListWrraper = document.querySelector("div#load_recent_release");

  const animeList: Array<Anime> = (await storage.get("animeList")).animeList;

  if (domAnimeListWrraper) {
    parseAnimeList(domAnimeListWrraper.querySelector("ul.items") as Element);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (!(mutation.type === "childList" && mutation.addedNodes.length > 0)) {
          return;
        }

        for (let i = 0; i < mutation.addedNodes.length; i++) {
          const node = mutation.addedNodes[i] as HTMLElement;

          if (!(node instanceof HTMLElement)) {
            continue;
          }

          const domAnimeList = node.querySelector("ul.items");

          if (domAnimeList) {
            parseAnimeList(domAnimeList);
          }
        }
      }
    });

    observer.observe(domAnimeListWrraper as Node, {
      childList: true,
      subtree: true,
    });
  } else {
    const domAnimeList = document.querySelector("ul.items") as Element;

    if (domAnimeList) {
      parseAnimeList(domAnimeList);
    }
  }

  function applyLoadingSpinner(element: Element): HTMLElement {
    const loader = document.createElement("div");
    loader.innerHTML = `
    <style>
      .loader-point-1 {
        animation: fade-point 0.4s ease-in-out 0.4s infinite alternate;
      }
      .loader-point-2 {
        animation: fade-point 0.4s ease-in-out 0.5s infinite alternate;
      }
      .loader-point-3 {
        animation: fade-point 0.4s ease-in-out 0.6s infinite alternate;
      }
      @keyframes fade-point {
        0% {
          opacity: 0;
        }
        100% {
          opacity: 1;
        }
      }
    </style>
      
    Malgo
    <span class="loader-point-1">.</span>
    <span class="loader-point-2">.</span>
    <span class="loader-point-3">.</span>
    `;

    loader.style.position = "absolute";
    loader.style.top = "0";
    loader.style.left = "2px";
    loader.style.textAlign = "left";
    loader.style.fontSize = "18px";
    loader.style.fontFamily = "Helvetica";
    loader.style.textShadow = "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000";
    loader.style.color = "#fff";
    loader.style.fontWeight = "bold";

    element.appendChild(loader);

    return loader;
  }

  function applyAnimeInfo(element: Element, name: string, anime: any): void {
    const score = document.createElement("div");
    score.innerHTML = `
    <div title="Score according to MAL">Score: ${anime.mean ?? anime.score ?? "N/A"}</div>
    <div title="Top ranked according to MAL">Ranked: ${
      (anime.rank ?? anime.ranked)?.toString().replace("#", "") ?? "N/A"
    }</div>
    <div title="Top popularity according to MAL">Popularity: ${
      anime.popularity?.toString().replace("#", "") ?? "N/A"
    }</div>
    `;

    score.style.position = "absolute";
    score.style.top = "0";
    score.style.left = "2px";
    score.style.textAlign = "left";
    score.style.fontSize = "18px";
    score.style.fontFamily = "Helvetica";
    score.style.textShadow = "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000";
    score.style.color = "#fff";
    score.style.fontWeight = "bold";
    element.appendChild(score);

    if (animeList) {
      checkAnimeStatus(element, name);
    }
  }

  function parseAnimeList(domAnimeList: Element): void {
    for (let i = 0; i < domAnimeList.children.length; i++) {
      const domAnime = domAnimeList.children[i];

      const animeName = domAnime.children[1].children[0].textContent?.replace(/ \(Dub\)$/, "") as string;

      const loader = applyLoadingSpinner(domAnime);
      getAnime(animeName).then((response) => {
        loader.remove();
        applyAnimeInfo(domAnime, animeName, response);
      });
    }
  }

  function checkAnimeStatus(element: Element, name: string) {
    const applyStatus = (status: string, color: string) => {
      const aElement = element.children[0].children[0];
      const subElement = aElement?.children[1] as HTMLElement;

      if (subElement) {
        subElement.innerText = status;
        subElement.style.color = color;
        subElement.style.backgroundPositionX = "right";
        subElement.style.display = "flex";
        subElement.style.alignItems = "end";
        subElement.style.paddingLeft = "2px";
        subElement.style.paddingBottom = "2px";
        subElement.style.fontWeight = "bold";
        subElement.style.fontSize = "16px";
        subElement.style.fontFamily = "Helvetica";
        subElement.style.textShadow = "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000";
      } else {
        const statusElement = document.createElement("div");
        statusElement.innerText = status;
        statusElement.style.color = color;
        statusElement.style.position = "absolute";
        statusElement.style.zIndex = "2";
        statusElement.style.bottom = "2px";
        statusElement.style.left = "2px";
        statusElement.style.fontWeight = "bold";
        statusElement.style.fontSize = "16px";
        statusElement.style.fontFamily = "Helvetica";
        statusElement.style.textShadow = "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000";
        aElement.appendChild(statusElement);
      }
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
