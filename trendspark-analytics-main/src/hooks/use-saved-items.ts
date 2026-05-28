import { useState, useEffect } from "react";

const EVENT_NAME = "helix-saved-items-changed";

export function useSavedItems() {
  const [followedAuthors, setFollowedAuthors] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem("helix_followed_authors");
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });

  const [followedKeywords, setFollowedKeywords] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem("helix_followed_keywords");
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        setFollowedAuthors(JSON.parse(localStorage.getItem("helix_followed_authors") || "[]"));
        setFollowedKeywords(JSON.parse(localStorage.getItem("helix_followed_keywords") || "[]"));
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

  // Author Following
  const isAuthorFollowed = (name: string) => followedAuthors.includes(name);

  const toggleAuthorFollow = (name: string) => {
    const updated = followedAuthors.includes(name)
      ? followedAuthors.filter((item) => item !== name)
      : [...followedAuthors, name];
    localStorage.setItem("helix_followed_authors", JSON.stringify(updated));
    setFollowedAuthors(updated);
    notifyChange();
    return !followedAuthors.includes(name); // Returns true if added, false if removed
  };

  // Keyword Following
  const isKeywordFollowed = (term: string) => followedKeywords.includes(term);

  const toggleKeywordFollow = (term: string) => {
    const updated = followedKeywords.includes(term)
      ? followedKeywords.filter((item) => item !== term)
      : [...followedKeywords, term];
    localStorage.setItem("helix_followed_keywords", JSON.stringify(updated));
    setFollowedKeywords(updated);
    notifyChange();
    return !followedKeywords.includes(term); // Returns true if added, false if removed
  };

  return {
    followedAuthors,
    followedKeywords,
    isAuthorFollowed,
    toggleAuthorFollow,
    isKeywordFollowed,
    toggleKeywordFollow,
  };
}
