const TARGET_CATEGORIES = [
    'phishing', 'malware', 'scam', 'crypto', 'bitcoin', 'cryptojacking', 'ddos', 'fakenews', 'hacking'
];

let inMemoryMainBlacklist = {};
let inMemoryUserBlacklist = [];

async function updateInMemoryBlacklists() {
    console.time("Tempo de leitura e carregamento na memória");
    const data = await chrome.storage.local.get(['mainBlacklist', 'userBlacklist']);
    inMemoryMainBlacklist = data.mainBlacklist || {};
    inMemoryUserBlacklist = data.userBlacklist || [];
    console.log("Blacklists foram atualizadas na memória.");
    console.timeEnd("Tempo de leitura e carregamento na memória");
}

async function loadInitialBlacklists() {
    console.log("Iniciando carregamento das blacklists do disco...");
    let allMaliciousDomains = {};

    console.time("Tempo de leitura e carregamento dos JSONs");
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
    console.timeEnd("Tempo de leitura e carregamento dos JSONs");
    
    console.time("Tempo de carregamento em RAM JSONs");
    await chrome.storage.local.set({ mainBlacklist: allMaliciousDomains });
    await chrome.storage.local.get({ userBlacklist: [] }, (data) => {
        chrome.storage.local.set({ userBlacklist: data.userBlacklist });
    });
    console.timeEnd("Tempo de carregamento em RAM JSONs");
    
    console.log(`Carregamento do disco concluído. Total de ${Object.keys(allMaliciousDomains).length} domínios na lista principal.`);
    
    await updateInMemoryBlacklists();
}

function handleNavigation(details) {
    if (details.frameId !== 0) {
        return;
    }

    const url = new URL(details.url);
    const domain = url.hostname.startsWith('www.') ? url.hostname.substring(4) : url.hostname;

    const mainCategory = inMemoryMainBlacklist[domain];
    const inUserBlacklist = inMemoryUserBlacklist.includes(domain);

    if (mainCategory || inUserBlacklist) {
        const category = mainCategory || 'personalizada';
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

chrome.runtime.onInstalled.addListener(async () => {
    console.log("Evento 'onInstalled' disparado.");
    console.time("Tempo total do processo de instalação");
    
    await loadInitialBlacklists();
    
    chrome.storage.local.set({ isEnabled: true }, () => {
        enableBlocking();
        console.log("Instalação concluída e bloqueio ativado.");
        console.timeEnd("Tempo total do processo de instalação");
    });
});

chrome.runtime.onStartup.addListener(async () => {
    console.log("Evento 'onStartup' disparado.");
    console.time("Tempo total do processo de inicialização (onStartup)");
    
    await updateInMemoryBlacklists();
    
    chrome.storage.local.get('isEnabled', ({ isEnabled }) => {
        if (isEnabled) {
            enableBlocking();
        }
    });
    console.timeEnd("Tempo total do processo de inicialização (onStartup)");
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace !== 'local') return;

    if (changes.isEnabled) {
        const newState = changes.isEnabled.newValue;
        if (newState) {
            enableBlocking();
        } else {
            disableBlocking();
        }
    }
    
    if (changes.userBlacklist) {
        console.log("Lista do usuário foi modificada, atualizando a memória...");
        updateInMemoryBlacklists();
    }
});
