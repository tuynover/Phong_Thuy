class TtsTicketService {
    // In-memory cache lưu các vé truyền phát luồng ngắn hạn (tối đa 1.000 vé metadata, không chứa binary audio)
    static ticketCache = new Map();

    static setTicket(ticketId, data) {
        if (TtsTicketService.ticketCache.size > 1000) {
            const firstKey = TtsTicketService.ticketCache.keys().next().value;
            TtsTicketService.ticketCache.delete(firstKey);
        }
        TtsTicketService.ticketCache.set(ticketId, {
            ...data,
            createdAt: Date.now()
        });
    }

    static getTicket(ticketId) {
        return TtsTicketService.ticketCache.get(ticketId);
    }

    static deleteTicket(ticketId) {
        return TtsTicketService.ticketCache.delete(ticketId);
    }
}

module.exports = TtsTicketService;
