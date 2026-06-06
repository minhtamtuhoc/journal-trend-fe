import { useState, useEffect } from "react";
import type { FollowedAuthor } from "@/types/domain";

const EVENT_NAME = "helix-saved-items-changed";
const FOLLOWED_AUTHORS_KEY = "helix_followed_authors";

function authorNamesMatch(a: string, b: string) {
  return a.toLowerCase() === b.toLowerCase();
}

function findAuthorIndex(authors: FollowedAuthor[], name: string) {
  return authors.findIndex((a) => authorNamesMatch(a.name, name));
}

/** Parses legacy string[] and new { id, name }[] from localStorage. */
export function parseFollowedAuthors(raw: unknown): FollowedAuthor[] {
  if (!Array.isArray(raw)) return [];

  const result: FollowedAuthor[] = [];
  for (const item of raw) {
    if (typeof item === "string" && item.length > 0) {
      result.push({ id: null, name: item });
      continue;
    }
    if (item && typeof item === "object" && "name" in item && typeof item.name === "string" && item.name.length > 0) {
      const id = "id" in item && (typeof item.id === "string" || item.id === null) ? item.id : null;
      result.push({ id: id ?? null, name: item.name });
    }
  }
  return result;
}

function loadFollowedAuthors(): FollowedAuthor[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FOLLOWED_AUTHORS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    const migrated = parseFollowedAuthors(parsed);
    const needsPersist = Array.isArray(parsed) && parsed.some((item) => typeof item === "string");
    if (needsPersist) {
      localStorage.setItem(FOLLOWED_AUTHORS_KEY, JSON.stringify(migrated));
    }
    return migrated;
  } catch {
    return [];
  }
}

function persistFollowedAuthors(authors: FollowedAuthor[]) {
  localStorage.setItem(FOLLOWED_AUTHORS_KEY, JSON.stringify(authors));
}

export function useSavedItems() {
  const [followedAuthors, setFollowedAuthors] = useState<FollowedAuthor[]>(loadFollowedAuthors);

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        setFollowedAuthors(parseFollowedAuthors(JSON.parse(localStorage.getItem(FOLLOWED_AUTHORS_KEY) || "[]")));
      } catch (e) {
        console.error(e);
      }
    };

    window.addEventListener(EVENT_NAME, handleStorageChange);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener(EVENT_NAME, handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const notifyChange = () => {
    window.dispatchEvent(new Event(EVENT_NAME));
  };

  const isAuthorFollowed = (name: string) => findAuthorIndex(followedAuthors, name) >= 0;

  const toggleAuthorFollow = (author: FollowedAuthor) => {
    const idx = findAuthorIndex(followedAuthors, author.name);
    const wasFollowed = idx >= 0;

    let updated: FollowedAuthor[];
    if (wasFollowed) {
      const existing = followedAuthors[idx];
      if (!existing.id && author.id) {
        updated = followedAuthors.map((item, i) => (i === idx ? { ...item, id: author.id } : item));
        persistFollowedAuthors(updated);
        setFollowedAuthors(updated);
        notifyChange();
        return true;
      }
      updated = followedAuthors.filter((_, i) => i !== idx);
    } else {
      updated = [...followedAuthors, { id: author.id, name: author.name }];
    }

    persistFollowedAuthors(updated);
    setFollowedAuthors(updated);
    notifyChange();
    return !wasFollowed;
  };

  return {
    followedAuthors,
    isAuthorFollowed,
    toggleAuthorFollow,
  };
}
