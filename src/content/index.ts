import initializeAnimeVideoPageChanges from "./display-anime-video-info";
import initializeAnimeListPageChanges from "./display-anime-list-info";
import initializeAnimeDetailsPageChanges from "./display-anime-info";
import { initializeData } from "../common/call-api";

await initializeData();

initializeAnimeListPageChanges();
initializeAnimeDetailsPageChanges();
initializeAnimeVideoPageChanges();
