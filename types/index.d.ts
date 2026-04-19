declare global {
  namespace Express {
    interface User {
      discordId: string;
      discordTag: string;
      username: string;
      avatar?: string;
      isAdmin?: boolean;
    }
  }
}
