export type User = {
  id: string;
  username: string;
  email: string;
  provider: "github" | "credentials";
  image: string;
};

export type Chatroom = {
  id: string;
  image: string;
}

export type Message = {
  displayId: string;
  senderId: string;
  content: string;
  highlight: boolean;
  visible: boolean;
  createdAt: string;
}