import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/auth";
import { getServices, queryKeys } from "@/services";
import { mockQueryDefaults } from "@/hooks/data/query-options";
import { isBrowser } from "@/hooks/data/client-only";
import { toast } from "sonner";
import { ApiError } from "@/api/errors";

export function useFollowedTopics() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.follows.topics,
    queryFn: () => getServices().follow.listTopics(),
    enabled: isBrowser && Boolean(user),
    placeholderData: [],
    retry: 1,
    ...mockQueryDefaults,
  });
}

export function useFollowedJournals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.follows.journals,
    queryFn: () => getServices().follow.listJournals(),
    enabled: isBrowser && Boolean(user),
    placeholderData: [],
    retry: 1,
    ...mockQueryDefaults,
  });
}

export function useFollowedAuthors() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.follows.authors,
    queryFn: () => getServices().follow.listFollowedAuthors(),
    enabled: isBrowser && Boolean(user),
    placeholderData: [],
    retry: 1,
    ...mockQueryDefaults,
  });
}

export function useFollowTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (topicId: string) => getServices().follow.followTopic(topicId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.follows.topics });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : "Failed to follow keyword.";
      toast.error(msg);
    },
  });
}

export function useUnfollowTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (topicId: string) => getServices().follow.unfollowTopic(topicId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.follows.topics });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useFollowJournal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (journalId: string) => getServices().follow.followJournal(journalId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.follows.journals });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : "Failed to follow journal.";
      toast.error(msg);
    },
  });
}

export function useUnfollowJournal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (journalId: string) => getServices().follow.unfollowJournal(journalId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.follows.journals });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useFollowAuthor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (authorId: string) => getServices().follow.followAuthor(authorId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.follows.authors });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : "Failed to follow author.";
      toast.error(msg);
    },
  });
}

export function useUnfollowAuthor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (authorId: string) => getServices().follow.unfollowAuthor(authorId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.follows.authors });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

