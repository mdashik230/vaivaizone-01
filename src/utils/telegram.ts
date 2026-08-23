export const escapeTelegramHtml = (text: string | number | undefined | null): string => {
  if (text === undefined || text === null) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
};

interface TelegramResponse {
  success: boolean;
  error?: string;
  migratedTo?: number | null;
}

export const sendTelegramNotification = async (botToken: string, chatId: string, message: string): Promise<TelegramResponse> => {
  if (!botToken || !chatId) {
    console.error("Telegram error: Bot token or chat ID missing", { botToken, chatId });
    return { success: false, error: "Bot token or chat ID missing" };
  }
  
  // Clean bot token if it starts with 'bot' (rare but happens)
  const cleanToken = botToken.trim().startsWith('bot') ? botToken.trim().replace(/^bot/, '') : botToken.trim();
  
  try {
    const url = `https://api.telegram.org/bot${cleanToken}/sendMessage`;
    console.log("Sending telegram notification to:", url);
    
    // First, try sending with HTML parse mode
    let response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId.trim(),
        text: message,
        parse_mode: "HTML",
      }),
    });
    
    let result = await response.json();

    // Handle migration to supergroup (Chat ID changes)
    if (!response.ok && result?.parameters?.migrate_to_chat_id) {
      const newChatId = result.parameters.migrate_to_chat_id.toString();
      console.warn(`Telegram group migrated. Retrying with new Chat ID: ${newChatId}`);
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: newChatId,
          text: message,
          parse_mode: "HTML",
        }),
      });
      result = await response.json();
    }
    
    // Fallback: If HTML parsing failed, strip HTML tags and send as plain text
    if (!response.ok && result?.description?.toLowerCase().includes("can't parse entities")) {
      console.warn("Telegram HTML parsing failed, falling back to plain text:", result);
      const plainText = message
        .replace(/<[^>]+>/g, '') // Strip HTML tags
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
        
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId.trim(),
          text: plainText,
        }),
      });
      result = await response.json();
    }
    
    if (!response.ok) {
      console.error("Telegram notification failed after fallback:", result);
      return { success: false, error: result?.description || "Unknown error" };
    } else {
      console.log("Telegram notification sent successfully!", result);
      const migratedTo = result?.parameters?.migrate_to_chat_id || null;
      return { success: true, migratedTo };
    }
  } catch (error) {
    console.error("Telegram notification error:", error);
    return { success: false, error: "Network error or invalid token" };
  }
};
