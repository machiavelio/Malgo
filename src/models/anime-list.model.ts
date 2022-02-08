import { Anime } from "./anime.model";

export interface AnimeList {
  watching: Array<Anime>;
  completed: Array<Anime>;
  onHold: Array<Anime>;
  dropped: Array<Anime>;
  toWatch: Array<Anime>;
}
