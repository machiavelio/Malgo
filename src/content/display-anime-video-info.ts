import { deleteAnime, getAnime, updateAnime } from "../common/call-api";
import storage from "../common/storage-sync";
import { Anime } from "../models/anime.model";

export default async function initializeAnimeVideoPageChanges(): Promise<void> {
  const domAnimeVideo = document.querySelector("div.anime_video_body>div.anime_video_body_watch")?.parentElement;

  const animeList: Array<Anime> = (await storage.get("animeList")).animeList;

  if (domAnimeVideo && animeList) {
    const domActionsList = domAnimeVideo.querySelector("div.favorites_book")?.children[0] as Element;

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
    };

    const scoreChanged = async (e: Event) => {
      const value = Number((e.target as HTMLSelectElement).value);
      anime.score = value;
      await updateAnime(anime);
      await storage.set({ animeList });
    };

    const episodesChanged = async (e: Event) => {
      const value = Number((e.target as HTMLInputElement).value);
      anime.numOfEpisodesWatched = value;
      await updateAnime(anime);
      await storage.set({ animeList });
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

    const statusSelect = statusElement.children[0] as HTMLSelectElement;

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
        <option selected value="0">&#9733; select</option>
        <option value="10">Masterpiece</option>
        <option value="9">Great</option>
        <option value="8">Very Good</option>
        <option value="7">Good</option>
        <option value="6">Fine</option>
        <option value="5">Average</option>
        <option value="4">Bad</option>
        <option value="3">Very Bad</option>
        <option value="2">Horrible</option>
        <option value="1">Appalling</option>
    </select>
    `;

    const scoreSelect = scoreElement.children[0] as HTMLSelectElement;

    if (anime) {
      scoreSelect.value = anime.score.toString();
    }

    scoreSelect.onchange = callback;

    return scoreElement;
  }

  function createEpisodesElement(anime: Anime, callback: (e: Event) => void) {
    const episodesElement = document.createElement("li");
    episodesElement.innerHTML = `
        <span>Episodes:</span>
        <input type="number" value="${anime?.numOfEpisodesWatched || 0}" style="width: 50px" />
        <span>/ ${anime?.numOfEpisodes || "?"}</span>
    `;

    const episodesInput = episodesElement.children[1] as HTMLInputElement;

    episodesInput.onchange = callback;

    return episodesElement;
  }
}
