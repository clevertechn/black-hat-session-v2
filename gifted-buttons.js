async function sendButtons(sock, jid, options = {}) {
    const text = options.footer
        ? `${options.text || ""}\n\n${options.footer}`
        : (options.text || "");

    return sock.sendMessage(jid, { text });
}

module.exports = { sendButtons };
