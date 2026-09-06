import path from "node:path";
import { runtimeSourceDirectory } from "./runtime-config.mjs";
import { readJson } from "../evidence/package.mjs";

export async function loadProfile(profileId) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(profileId)) throw new Error(`Invalid profile id: ${profileId}`);
  const profilePath = path.join(runtimeSourceDirectory, "profiles", `${profileId}.json`);

  try {
    return await readJson(profilePath);
  } catch (error) {
    if (error.code === "ENOENT") throw new Error(`Unknown review profile: ${profileId}`);
    throw error;
  }
}
