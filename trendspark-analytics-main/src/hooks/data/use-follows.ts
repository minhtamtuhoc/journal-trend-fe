import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/auth";
import { getServices, queryKeys } from "@/services";
import { mockQueryDefaults } from "@/hooks/data/query-options";
import { isBrowser } from "@/hooks/data/client-only";

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
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.follows.topics }),
  });
}

export function useUnfollowTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (topicId: string) => getServices().follow.unfollowTopic(topicId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.follows.topics }),
  });
}

export function useFollowJournal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (journalId: string) => getServices().follow.followJournal(journalId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.follows.journals }),
  });
}

export function useUnfollowJournal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (journalId: string) => getServices().follow.unfollowJournal(journalId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.follows.journals }),
  });
}

export function useFollowAuthor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (authorId: string) => getServices().follow.followAuthor(authorId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.follows.authors }),
  });
}

export function useUnfollowAuthor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (authorId: string) => getServices().follow.unfollowAuthor(authorId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.follows.authors }),
  });
}

