export interface Analysis {
  mechanismType: string;
  isCorrect: boolean;
  errors: string[];
  corrections: string[];
  correctMechanism: string;
  explanation: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageData?: string;
  timestamp: number;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}
