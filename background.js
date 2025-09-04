const TARGET_CATEGORIES = [
    'phishing', 'malware', 'scam', 'crypto', 'bitcoin', 'cryptojacking',
    'ddos', 'fakenews', 'hacking', 'gambling'
];

let inMemoryMainBlacklist = {};
let inMemoryUserBlacklist = [];
let inMemoryBlockedCategories = [];
let inMemoryIsCustomListEnabled = true;
let inMemoryIsEnabled = true;
let blacklistsLoaded = false;

async function updateInMemoryState() {
    console.time("Tempo para carregar blacklists do storage para a memória");
    const data = await chrome.storage.local.get(['mainBlacklist', 'userBlacklist', 'blockedCategories', 'isCustomListEnabled', 'isEnabled']);
    inMemoryMainBlacklist = data.mainBlacklist || {};
    inMemoryUserBlacklist = data.userBlacklist || [];
    inMemoryBlockedCategories = data.blockedCategories || [];
    inMemoryIsCustomListEnabled = data.isCustomListEnabled !== false;
    inMemoryIsEnabled = data.isEnabled !== false;
    blacklistsLoaded = true;
    console.log("Blacklists foram atualizadas na memória.");
    console.timeEnd("Tempo para carregar blacklists do storage para a memória");
}

async function loadInitialBlacklists() {
    console.log("Iniciando carregamento das blacklists do disco...");
    let allMaliciousDomains = {};

    console.time("Tempo para buscar e processar todos os JSONs");
    for (const category of TARGET_CATEGORIES) {
        try {
            const response = await fetch(chrome.runtime.getURL(`Lists/${category}.json`));
            if (response.ok) {
                const domains = await response.json();
                Object.assign(allMaliciousDomains, domains);
            }
        } catch (error) {
            console.warn(`Erro ao carregar a lista para '${category}':`, error);
        }
    }
    console.timeEnd("Tempo para buscar e processar todos os JSONs");
    
    console.time("Tempo para salvar blacklists no storage");
    await chrome.storage.local.set({ mainBlacklist: allMaliciousDomains });
    const data = await chrome.storage.local.get({ 
        userBlacklist: [], 
        blockedCategories: TARGET_CATEGORIES,
        isCustomListEnabled: true,
        isEnabled: true
    });
    await chrome.storage.local.set(data);
    console.timeEnd("Tempo para salvar blacklists no storage");
    
    console.log(`Carregamento do disco concluído. Total de ${Object.keys(allMaliciousDomains).length} domínios.`);
    await updateInMemoryState();
}

async function handleNavigation(details) {
    if (details.frameId !== 0) {
        return;
    }

    if (!blacklistsLoaded) {
        console.log("Service Worker acordou ou blacklists não carregadas. Recarregando para a memória...");
        await updateInMemoryState();
    }

    if (!inMemoryIsEnabled) {
        return; // Do nothing if the extension is disabled
    }

    const url = new URL(details.url);
    const domain = url.hostname.startsWith('www.') ? url.hostname.substring(4) : url.hostname;

    let blockReason = null;

    // Check custom list first for precedence
    if (inMemoryIsCustomListEnabled && inMemoryUserBlacklist.includes(domain)) {
        blockReason = { domain: domain, category: 'personalizada' };
    }

    // If not on custom list, check main category list
    if (!blockReason) {
        const domainCategory = inMemoryMainBlacklist[domain];
        if (domainCategory && inMemoryBlockedCategories.includes(domainCategory)) {
            blockReason = { domain: domain, category: domainCategory };
        }
    }
    
    if (blockReason) {
        const blockedPageUrl = chrome.runtime.getURL(`blocked.html?domain=${blockReason.domain}&category=${blockReason.category}`);
        chrome.tabs.update(details.tabId, { url: blockedPageUrl });
    }
}

chrome.runtime.onInstalled.addListener(async (details) => {
    console.log("Evento 'onInstalled' disparado:", details.reason);
    await loadInitialBlacklists();
    chrome.webNavigation.onBeforeNavigate.addListener(handleNavigation);
    console.log("Instalação concluída e bloqueio ativado.");
});

chrome.runtime.onStartup.addListener(async () => {
    console.log("Evento 'onStartup' (navegador iniciado).");
    await updateInMemoryState();
    if (!chrome.webNavigation.onBeforeNavigate.hasListener(handleNavigation)) {
        chrome.webNavigation.onBeforeNavigate.addListener(handleNavigation);
    }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace !== 'local') return;
    
    console.log("Configurações foram modificadas, atualizando a memória...");
    updateInMemoryState();
});

// Ensures the listener is active on initial load, in case the extension was updated
if (!chrome.webNavigation.onBeforeNavigate.hasListener(handleNavigation)) {
    chrome.webNavigation.onBeforeNavigate.addListener(handleNavigation);
}
