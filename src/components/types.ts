export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  fileName?: string;
  fileType?: string;
  fileDataUrl?: string;
  toolName?: string;
  toolResult?: any;
  downloadData?: string;
  downloadFilename?: string;
  htmlPreviewData?: string;
  htmlPreviewFilename?: string;
  videoUrl?: string;
}

export interface ActionTask {
  id: string;
  serviceName: string;
  action: string;
  status: 'processing' | 'completed' | 'failed';
  result?: string;
  downloadData?: string;
  downloadFilename?: string;
  htmlPreviewData?: string;
  htmlPreviewFilename?: string;
  videoUrl?: string;
  toolName?: string;
}

export interface AgentSettings {
  userName: string;
  agentName: string;
  personality: string;
  avatarUrl: string;
  selectedVoice: string;
  selectedLanguage: string;
  knowledgeBase: string;
  autoExecuteTools: boolean;
  saveConversationHistory: boolean;
}

export interface TranscriptData {
  role: 'user' | 'model';
  text: string;
}

export interface VoiceProfile {
  gender: 'male' | 'female' | 'neutral';
  pitchRange: 'low' | 'medium' | 'high';
  speechRate: 'slow' | 'normal' | 'fast';
}
