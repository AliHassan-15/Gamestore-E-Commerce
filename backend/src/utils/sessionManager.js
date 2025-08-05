// Centralized session management
const activeSessions = new Map();

const sessionManager = {
  // Add a new session
  addSession: (sessionId, sessionData) => {
    activeSessions.set(sessionId, sessionData);
    console.log(`📝 Session added: ${sessionData.email} (${sessionData.role})`);
  },

  // Get a session
  getSession: (sessionId) => {
    return activeSessions.get(sessionId);
  },

  // Remove a session
  removeSession: (sessionId) => {
    const session = activeSessions.get(sessionId);
    if (session) {
      activeSessions.delete(sessionId);
      console.log(`🗑️ Session removed: ${session.email}`);
      return true;
    }
    return false;
  },

  // Check if session exists
  hasSession: (sessionId) => {
    return activeSessions.has(sessionId);
  },

  // Get all sessions (for admin)
  getAllSessions: () => {
    return Array.from(activeSessions.entries()).map(([sessionId, session]) => ({
      sessionId,
      userId: session.userId,
      email: session.email,
      role: session.role,
      createdAt: session.createdAt
    }));
  },

  // Get sessions map (for middleware)
  getSessionsMap: () => {
    return activeSessions;
  }
};

module.exports = sessionManager; 