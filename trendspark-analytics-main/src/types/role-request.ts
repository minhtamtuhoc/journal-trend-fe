export type UserRequestableRole = "STUDENT" | "RESEARCHER" | "LECTURER";

export type RoleRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export type RoleRequestRejectionReason =
  | "INSUFFICIENT_PROOF"
  | "INVALID_PROOF"
  | "ROLE_MISMATCH"
  | "DUPLICATE_REQUEST"
  | "OTHER";

export const REJECTION_REASON_LABELS: Record<RoleRequestRejectionReason, { title: string; desc: string }> = {
  INSUFFICIENT_PROOF: {
    title: "Insufficient Proof",
    desc: "The proof provided is insufficient or unclear",
  },
  INVALID_PROOF: {
    title: "Invalid Proof",
    desc: "The proof provided is invalid or could not be verified",
  },
  ROLE_MISMATCH: {
    title: "Role Mismatch",
    desc: "The requested role does not match the reason provided",
  },
  DUPLICATE_REQUEST: {
    title: "Duplicate Request",
    desc: "A similar request has already been submitted or reviewed",
  },
  OTHER: {
    title: "Other Reason",
    desc: "Other reason not specified in standard categories",
  },
};

export interface RoleUpgradeRequestResponse {
  id: number;
  userId: number;
  userEmail: string;
  userName: string;
  currentRole: string;
  requestedRole: UserRequestableRole;
  reason: string;
  proofUrl?: string | null;
  status: RoleRequestStatus;
  reviewedByEmail?: string | null;
  reviewedAt?: string | null;
  reviewNote?: string | null;
  rejectionReason?: RoleRequestRejectionReason | null;
  rejectionReasonText?: string | null;
  createdAt: string;
}

export interface RoleChangeLogResponse {
  id: number;
  operatorEmail: string;
  targetUserId: number;
  targetUserEmail: string;
  oldRole: string;
  newRole: string;
  reason: string;
  createdAt: string;
}

export interface RoleUpgradeRequestCreateRequest {
  requestedRole: UserRequestableRole;
  reason: string;
  proofUrl?: string;
}

export interface RoleRequestApproveRequest {
  note?: string;
}

export interface RoleRequestRejectRequest {
  rejectionReason: RoleRequestRejectionReason;
}
