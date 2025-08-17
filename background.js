const TARGET_CATEGORIES = [
    'phishing', 'malware', 'scam', 'crypto', 'bitcoin', 'cryptojacking',
    'ddos', 'fakenews', 'hacking'
];

async function loadBlacklists() {
    console.log("Carregando blacklists...");
    let allMaliciousDomains = {};

    for (const category of TARGET_CATEGORIES) {
        try {
            const response = await fetch(chrome.runtime.getURL(`Lists/${category}.json`));
            if (response.ok) {
                const domains = await response.json();
                Object.assign(allMaliciousDomains, domains);
            } else {
                console.warn(`Aviso: Não foi possível carregar a lista para a categoria '${category}'.`);
            }
        } catch (error) {
            console.warn(`Erro ao carregar a lista para '${category}':`, error);
        }
    }

    await chrome.storage.local.set({ blacklist: allMaliciousDomains });
    console.log(`Carregamento concluído. Total de ${Object.keys(allMaliciousDomains).length} domínios.`);
}

async function handleNavigation(details) {
    if (details.frameId !== 0) {
        return;
    }

    const { blacklist } = await chrome.storage.local.get('blacklist');
    if (!blacklist) return;

    const url = new URL(details.url);
    const domain = url.hostname.startsWith('www.') ? url.hostname.substring(4) : url.hostname;

    if (blacklist[domain]) {
        const category = blacklist[domain];
        const blockedPageUrl = chrome.runtime.getURL(`blocked.html?domain=${domain}&category=${category}`);

        chrome.tabs.update(details.tabId, { url: blockedPageUrl });
    }
}

function enableBlocking() {
    chrome.webNavigation.onBeforeNavigate.addListener(handleNavigation);
    console.log("Bloqueio ativado.");
}

function disableBlocking() {
    chrome.webNavigation.onBeforeNavigate.removeListener(handleNavigation);
    console.log("Bloqueio desativado.");
}

chrome.runtime.onInstalled.addListener(() => {
    loadBlacklists();
    chrome.storage.local.set({ isEnabled: true }, () => {
        enableBlocking();
    });
});

chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get('isEnabled', ({ isEnabled }) => {
        if (isEnabled) {
            enableBlocking();
        }
    });
});