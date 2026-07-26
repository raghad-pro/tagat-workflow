export interface User {
  id: number | string;
  name: string;
  email: string;
  image?: string | null;
}

export interface ConversationMember {
  id: number | string;
  user_id: number | string;
  conversation_id: number | string;
  role: 'admin' | 'member';
  user: User;
}

export interface Message {
  id: number | string;
  conversation_id: number | string;
  user_id: number | string;
  body: string;
  attachment?: string | null;
  created_at: string;
  user?: User;
}

export interface Conversation {
  id: number | string;
  name: string;
  type: 'private' | 'group';
  created_at: string;
  updated_at: string;
  members?: ConversationMember[];
  last_message?: Message;
  messages?: Message[];
  unread_count?: number;
}

export interface ConversationsQueryParams {
  search?: string;
  page?: number;
  per_page?: number;
}
