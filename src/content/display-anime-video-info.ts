import { deleteAnime, getAnime, updateAnime } from "../common/call-api";
import storage from "../common/storage-sync";
import { Anime } from "../models/anime.model";

export default async function initializeAnimeVideoPageChanges(): Promise<void> {
  const domAnimeVideo = document.querySelector("div.anime_video_body>div.anime_video_body_watch")?.parentElement;

  const animeList: Array<Anime> = (await storage.get("animeList")).animeList;

  if (domAnimeVideo && animeList) {
    (
      document.querySelector("div.download-anime .anime_video_note_watch .anime_video_body_report") as HTMLElement
    ).style.top = "initial";

    const domActionsList = domAnimeVideo.querySelector("div.favorites_book")?.children[0] as Element;

    (domActionsList as HTMLElement).style.display = "flex";
    (domActionsList as HTMLElement).style.flexWrap = "wrap";
    (domActionsList as HTMLElement).style.alignItems = "center";

    const animeName = domAnimeVideo.children[0].textContent?.replace(/( \(Dub\))? Episode.*gogoanime$/, "") as string;
    let anime = animeList.find((anime: Anime) => anime.name == animeName || anime.altName == animeName) as Anime;

    const statusChanged = async (e: Event) => {
      const value = Number((e.target as HTMLSelectElement).value);

      if (value === 0) {
        await deleteAnime(anime.id);
        domActionsList.removeChild(scoreElement);
        domActionsList.removeChild(episodesElement);
        statusElement.children[0].children[0].textContent = "Not Saved";
        (scoreElement.children[0] as HTMLSelectElement).value = "0";
        (episodesElement.children[1] as HTMLInputElement).value = "0";
        const animeIndex = animeList.findIndex((anim: Anime) => anim.id === anime.id);
        animeList.splice(animeIndex, 0);
        anime.id = 0;
      } else {
        if (!anime?.id) {
          anime = await getAnime(animeName);
          anime.score = 0;
          anime.numOfEpisodesWatched = 0;
          anime.numOfEpisodes = (anime as any).num_episodes;
          animeList.push(anime);
        }
        anime.status = value;
        await updateAnime(anime);
        domActionsList.appendChild(scoreElement);
        domActionsList.appendChild(episodesElement);
        statusElement.children[0].children[0].textContent = "Remove";
        episodesElement.children[2].textContent = `/ ${anime.numOfEpisodes}`;
      }
      await storage.set({ animeList });
      displaySavePopdown();
    };

    const scoreChanged = async (e: Event) => {
      const value = Number((e.target as HTMLSelectElement).value);
      anime.score = value;
      await updateAnime(anime);
      await storage.set({ animeList });
      displaySavePopdown();
    };

    const episodesChanged = async (e: Event) => {
      const value = Number((e.target as HTMLInputElement).value);
      anime.numOfEpisodesWatched = value;
      await updateAnime(anime);
      await storage.set({ animeList });
      displaySavePopdown();
    };

    const statusElement = createStatusElement(anime as Anime, statusChanged);
    const scoreElement = createScoreElement(anime as Anime, scoreChanged);
    const episodesElement = createEpisodesElement(anime as Anime, episodesChanged);

    domActionsList.appendChild(statusElement);

    if (anime?.status) {
      domActionsList.appendChild(scoreElement);
      domActionsList.appendChild(episodesElement);
    }
  }

  function displaySavePopdown() {
    document.getElementById("changes-saved-popdown")?.remove();
    const popdown = document.createElement("div");
    popdown.innerHTML = `
    <style>
      #changes-saved-popdown {
        animation: popdown 0.4s ease-out;
      }
      @keyframes popdown {
        0% {
          top: -100px;
        }
        100% {
          top: 1rem;
        }
      }
    </style>
    Changes saved
    `;
    popdown.id = "changes-saved-popdown";
    popdown.style.backgroundColor = "#2db039";
    popdown.style.padding = "0.75rem";
    popdown.style.borderRadius = "0.25rem";
    popdown.style.boxShadow = "0px 0px 10px 5px #000";
    popdown.style.color = "#fff";
    popdown.style.position = "fixed";
    popdown.style.top = "1rem";
    popdown.style.left = "50%";
    popdown.style.transform = "translateX(-50%)";
    popdown.style.zIndex = "10";
    popdown.style.fontSize = "1rem";

    document.body.appendChild(popdown);

    const timeout = setTimeout(() => {
      popdown.remove();
      clearTimeout(timeout);
    }, 2000);
  }

  function createStatusElement(anime: Anime, callback: (e: Event) => void) {
    const statusElement = document.createElement("li");
    statusElement.innerHTML = `
    <select name="status" id="status">
      <option value="0">${anime ? "Remove" : "Not Saved"}</option>
      <option value="1">Watching</option>
      <option value="2">Completed</option>
      <option value="3">On Hold</option>
      <option value="4">Dropped</option>
      <option value="6">Plan to Watch</option>
    </select>
    `;
    statusElement.style.padding = "0";
    statusElement.style.cursor = "pointer";

    const statusSelect = statusElement.children[0] as HTMLSelectElement;

    statusSelect.style.height = "100%";

    if (anime) {
      statusSelect.value = anime.status.toString();
    }

    statusSelect.onchange = callback;

    return statusElement;
  }

  function createScoreElement(anime: Anime, callback: (e: Event) => void) {
    const scoreElement = document.createElement("li");
    scoreElement.innerHTML = `
    <select name="score" id="score">
      <option selected value="0">Score</option>
      <option value="10">(10) Masterpiece</option>
      <option value="9">(9) Great</option>
      <option value="8">(8) Very Good</option>
      <option value="7">(7) Good</option>
      <option value="6">(6) Fine</option>
      <option value="5">(5) Average</option>
      <option value="4">(4) Bad</option>
      <option value="3">(3) Very Bad</option>
      <option value="2">(2) Horrible</option>
      <option value="1">(1) Appalling</option>
    </select>
    `;
    scoreElement.style.padding = "0";
    scoreElement.style.cursor = "pointer";

    const scoreSelect = scoreElement.children[0] as HTMLSelectElement;

    scoreSelect.style.height = "100%";

    if (anime) {
      scoreSelect.value = anime.score.toString();
    }

    scoreSelect.onchange = callback;

    return scoreElement;
  }

  function createEpisodesElement(anime: Anime, callback: (e: Event) => void) {
    const episodesElement = document.createElement("li");
    episodesElement.innerHTML = `
      <style>
        input#input-malgo {
          width: 50px;
          text-align: right;
          border: none;
          padding-right: 2px;
        }
        input#input-malgo:focus {
          background-color: #dfdfdf;
          border-radius: 0.25rem;
        }
        input#input-malgo::-webkit-outer-spin-button,
        input#input-malgo::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      </style>
      <span style="color: #000; font-size: 13.33px; margin-right: 5px">Episodes:</span>
      <input id="input-malgo" type="number" value="${anime?.numOfEpisodesWatched || 0}" />
      <span style="color: #000; padding-right: 5px">/ ${anime?.numOfEpisodes || "?"}</span>
    `;
    episodesElement.style.padding = "0";
    episodesElement.style.backgroundColor = "#fff";
    episodesElement.style.cursor = "pointer";
    episodesElement.style.display = "inline-flex";
    episodesElement.style.alignItems = "center";
    episodesElement.style.cursor = "default";

    const episodesInput = episodesElement.children[2] as HTMLInputElement;

    episodesInput.onchange = callback;

    return episodesElement;
  }
}
