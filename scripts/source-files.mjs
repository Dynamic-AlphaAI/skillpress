import { execFileSync } from "node:child_process";
import { lstatSync, realpathSync } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";

/** Reject links, including linked parent directories, before reading publisher files. */
export function safeSourceFile(repoDir, file) {
  const rel = relative(resolve(repoDir), resolve(file));
  if (!rel || rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel) ||
      !lstatSync(file).isFile() || realpathSync(file) !== join(realpathSync(repoDir), rel)) {
    throw new Error(`Unsupported source file: ${rel}`);
  }
  return file;
}

/** Metadata and licenses must be committed too, even for a local source checkout. */
export function trackedSourceFile(repoDir, file) {
  safeSourceFile(repoDir, file);
  execFileSync("git", ["-C", repoDir, "ls-files", "--error-unmatch", "--", relative(repoDir, file)], { stdio: "pipe" });
  return file;
}
