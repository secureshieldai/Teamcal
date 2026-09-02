export type BotType = 'space' | 'conversational';
export type BotStatus = 'draft' | 'active' | 'paused';

export type BotAutomationKind =
  | 'welcome_dm' | 'onboarding' | 'faq' | 'announcement' | 'reminder' | 'poll'
  | 'recommend_resource' | 'spam_detect' | 'notify_admins' | 'confirm_membership'
  | 'manage_access' | 'collect_replies' | 'escalate';

export type BotPermissionKey =
  | 'send_dms' | 'publish_announcements' | 'view_member_info' | 'create_polls'
  | 'moderate_content' | 'access_resources' | 'manage_membership_access'
  | 'collect_lead_info' | 'display_products' | 'open_checkout' | 'notify_admins';

export type BotPermissions = Partial<Record<BotPermissionKey, boolean>>;

export interface BotKnowledgeBase {
  businessName?: string;
  business?: string;
  hours?: string;
  delivery?: string;
  refunds?: string;
  booking?: string;
  membership?: string;
  instructions?: string;
  products?: string[];
  prices?: string[];
  faqs?: { q: string; a: string }[];
  links?: string[];
  resources?: string[];
  documents?: { title?: string; url: string }[];
}

export interface BotConnection {
  id?: string;
  space_type: 'channel' | 'community';
  space_id: string;
  space_name?: string;
  avatar?: string | null;
}

export interface BotAutomation {
  id?: string;
  bot_id?: string;
  kind: BotAutomationKind;
  enabled: boolean;
  config?: Record<string, unknown>;
}

export interface BotSequenceStep {
  order: number;
  message: string;
  delay_minutes?: number;
  buttons?: { label: string; action?: string }[];
  condition?: string;
  action?: string;
}

export interface BotAnalytics {
  days: number;
  conversationsStarted: number;
  leadsCollected: number;
  messagesSent: number;
  membersWelcomed: number;
  questionsAnswered: number;
  humanHandoffs: number;
  linkClicks: number;
  actionsCompleted: number;
  failedAutomations: number;
}

export interface Bot {
  id: string;
  owner_id: string;
  type: BotType;
  name: string;
  avatar?: string | null;
  description?: string;
  purpose?: string;
  welcome_message?: string;
  tone?: string;
  language?: string;
  status: BotStatus;
  public_slug?: string | null;
  knowledge_base?: BotKnowledgeBase;
  permissions?: BotPermissions;
  settings?: Record<string, unknown>;
  connections?: BotConnection[];
  automations?: BotAutomation[];
  sequence?: BotSequenceStep[];
  stats?: BotAnalytics;
  created_at?: string;
  updated_at?: string;
}

export interface BotEvent {
  id: string;
  bot_id: string;
  type: string;
  meta: Record<string, unknown>;
  created_at: string;
}

export interface BotConversation {
  id: string;
  bot_id: string;
  channel: 'public' | 'space';
  status: 'open' | 'resolved' | 'follow_up';
  handoff_active: boolean;
  stopped: boolean;
  member_user_id?: string | null;
  assigned_admin_id?: string | null;
  last_message_at: string;
  created_at: string;
}

export interface BotMessage {
  id?: string;
  conversation_id?: string;
  role: 'bot' | 'user' | 'admin' | 'system';
  content: string;
  meta?: Record<string, unknown>;
  created_at?: string;
}

export interface BotLead {
  id: string;
  bot_id: string;
  conversation_id?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  fields?: Record<string, unknown>;
  consent: boolean;
  created_at: string;
}

export interface BotSpacesResponse {
  channels: BotConnection[];
  communities: (BotConnection & { is_membership?: boolean })[];
}
