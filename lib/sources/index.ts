import { anilistSource } from "./anilist";
import { comicsSource } from "./comics";
import { showsSource } from "./shows";
import type { CharacterSource, Source } from "./types";

export const characterSources: Record<Source, CharacterSource> = {
  anime: anilistSource,
  comics: comicsSource,
  shows: showsSource,
};

export function getCharacterSource(source: Source): CharacterSource {
  return characterSources[source];
}

export * from "./types";
