import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

// Type for Convex IDs - accepts both string and typed Id
type ConvexId<T extends string> = Id<T> | string | null | undefined;

// User hooks
export const useCreateUser = () => useMutation(api.users.create);
export const useGetUser = (id: string | undefined) => useQuery(api.users.get, id ? { id } : "skip");
export const useGetUserByEmail = (email: string | undefined) => useQuery(api.users.getByEmail, email ? { email } : "skip");
export const useListUsers = () => useQuery(api.users.list);
export const useUpdateUser = () => useMutation(api.users.update);
export const useDeleteUser = () => useMutation(api.users.remove);

// Organization hooks
export const useCreateOrganization = () => useMutation(api.organizations.create);
export const useGetOrganization = (id: string | undefined) => useQuery(api.organizations.get, id ? { id } : "skip");
export const useGetOrganizationBySlug = (slug: string | undefined) => useQuery(api.organizations.getBySlug, slug ? { slug } : "skip");
export const useListOrganizationsForUser = (user_id: string | undefined) => useQuery(api.organizations.listForUser, user_id ? { user_id } : "skip");
export const useGetOrganizationMembers = (organization_id: string | undefined) => useQuery(api.organizations.getMembers, organization_id ? { organization_id } : "skip");

// Campaign hooks
export const useCreateCampaign = () => useMutation(api.campaigns.create);
export const useGetCampaign = (id: ConvexId<"campaigns">) =>
    useQuery(api.campaigns.get, id ? { id: id as Id<"campaigns"> } : "skip");
export const useListCampaignsByOrganization = (organization_id: ConvexId<"organizations">) =>
    useQuery(api.campaigns.listByOrganization, organization_id ? { organization_id: organization_id as Id<"organizations"> } : "skip");
export const useListCampaignsByStatus = (status: string | undefined) =>
    useQuery(api.campaigns.listByStatus, status ? { status: status as any } : "skip");
export const useUpdateCampaignStatus = () => useMutation(api.campaigns.updateStatus);
export const useUpdateCampaignBriefData = () => useMutation(api.campaigns.updateBriefData);
export const useUpdateCampaignCreativeConcepts = () => useMutation(api.campaigns.updateCreativeConcepts);
export const useDeleteCampaign = () => useMutation(api.campaigns.remove);

// Deliverable hooks
export const useCreateDeliverable = () => useMutation(api.deliverables.create);
export const useGetDeliverable = (id: ConvexId<"deliverables">) =>
    useQuery(api.deliverables.get, id ? { id: id as Id<"deliverables"> } : "skip");
export const useListDeliverablesByCampaign = (campaign_id: ConvexId<"campaigns">) =>
    useQuery(api.deliverables.listByCampaign, campaign_id ? { campaign_id: campaign_id as Id<"campaigns"> } : "skip");
export const useListDeliverablesByType = (type: string | undefined) =>
    useQuery(api.deliverables.listByType, type ? { type: type as any } : "skip");
export const useListDeliverablesByStatus = (status: string | undefined) =>
    useQuery(api.deliverables.listByStatus, status ? { status: status as any } : "skip");
export const useUpdateDeliverable = () => useMutation(api.deliverables.update);
export const useUpdateDeliverableStatus = () => useMutation(api.deliverables.updateStatus);
export const useDeleteDeliverable = () => useMutation(api.deliverables.remove);
export const useSubscribeToDeliverables = (campaign_id: ConvexId<"campaigns">) =>
    useQuery(api.deliverables.subscribe, campaign_id ? { campaign_id: campaign_id as Id<"campaigns"> } : "skip");

// Conversation hooks
export const useCreateConversation = () => useMutation(api.conversations.create);
export const useGetConversation = (id: string | undefined) => useQuery(api.conversations.get, id ? { id } : "skip");
export const useListConversationsByOrganization = (organization_id: string | undefined) => useQuery(api.conversations.listByOrganization, organization_id ? { organization_id } : "skip");
export const useListConversationsByCampaign = (campaign_id: string | undefined) => useQuery(api.conversations.listByCampaign, campaign_id ? { campaign_id } : "skip");
export const useUpdateConversation = () => useMutation(api.conversations.update);
export const useDeleteConversation = () => useMutation(api.conversations.remove);

// Message hooks
export const useCreateMessage = () => useMutation(api.messages.create);
export const useGetMessage = (id: string | undefined) => useQuery(api.messages.get, id ? { id } : "skip");
export const useListMessagesByConversation = (conversation_id: string | undefined) => useQuery(api.messages.listByConversation, conversation_id ? { conversation_id } : "skip");
export const useListMessagesByUser = (user_id: string | undefined) => useQuery(api.messages.listByUser, user_id ? { user_id } : "skip");
export const useUpdateMessage = () => useMutation(api.messages.update);
export const useDeleteMessage = () => useMutation(api.messages.remove);
export const useAddUserMessage = () => useMutation(api.messages.addUserMessage);
export const useAddAssistantMessage = () => useMutation(api.messages.addAssistantMessage);
export const useAddSystemMessage = () => useMutation(api.messages.addSystemMessage);