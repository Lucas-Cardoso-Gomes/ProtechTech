document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const domain = params.get('domain');
    const category = params.get('category');
    const originalUrl = params.get('originalUrl');

    document.getElementById('domain').textContent = domain || 'desconhecido';
    document.getElementById('category').textContent = category || 'risco de segurança';

    const addToWhitelistBtn = document.getElementById('addToWhitelistBtn');
    addToWhitelistBtn.addEventListener('click', () => {
        if (domain) {
            chrome.storage.local.get({ userWhitelist: [] }, ({ userWhitelist }) => {
                if (!userWhitelist.includes(domain)) {
                    const updatedWhitelist = [...userWhitelist, domain];
                    chrome.storage.local.set({ userWhitelist: updatedWhitelist }, () => {
                        if (originalUrl) {
                            window.location.href = decodeURIComponent(originalUrl);
                        } else {
                            window.location.href = `https://${domain}`;
                        }
                    });
                }
            });
        }
    });
});