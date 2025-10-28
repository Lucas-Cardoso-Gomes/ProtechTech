const TARGET_CATEGORIES = [
    'phishing', 'malware', 'bitcoin', 'cryptojacking',
    'ddos', 'fakenews', 'hacking', 'gambling'
];

let inMemoryMainBlacklist = {};
let inMemoryUserBlacklist = [];
let inMemoryUserWhitelist = [];
let inMemoryBlockedCategories = [];
let inMemoryIsCustomListEnabled = true;
let inMemoryIsEnabled = true;
let inMemoryTermsAccepted = false;
let inMemoryDnsSetting = 'disabled';
let blacklistsLoaded = false;

const dnsSettings = {
    disabled: {
        value: {
            mode: 'direct'
        },
        levelOfControl: 'controllable_by_this_extension'
    },
    malware: {
        value: {
            mode: 'pac_script',
            pacScript: {
                data: `function FindProxyForURL(url, host) {
                    return "HTTPS 1.1.1.2:443; HTTPS 1.0.0.2:443";
                }`
            }
        },
        levelOfControl: 'controlled_by_this_extension'
    },
    family: {
        value: {
            mode: 'pac_script',
            pacScript: {
                data: `function FindProxyForURL(url, host) {
                    return "HTTPS 1.1.1.3:443; HTTPS 1.0.0.3:443";
                }`
            }
        },
        levelOfControl: 'controlled_by_this_extension'
    }
};

async function applyDnsSetting() {
    const setting = dnsSettings[inMemoryDnsSetting];
    if (setting) {
        chrome.proxy.settings.set({ value: setting.value }, () => {
            console.log(`DNS setting applied: ${inMemoryDnsSetting}`);
        });
    }
}

async function updateInMemoryState() {
    console.time("Tempo para carregar do armazenamento para a memória");
    const data = await chrome.storage.local.get(['mainBlacklist', 'userBlacklist', 'userWhitelist', 'blockedCategories', 'isCustomListEnabled', 'isEnabled', 'termsAccepted', 'dnsSetting']);
    inMemoryMainBlacklist = data.mainBlacklist || {};
    inMemoryUserBlacklist = data.userBlacklist || [];
    inMemoryUserWhitelist = data.userWhitelist || [];
    inMemoryBlockedCategories = data.blockedCategories || [];
    inMemoryIsCustomListEnabled = data.isCustomListEnabled !== false;
    inMemoryIsEnabled = data.isEnabled !== false;
    inMemoryTermsAccepted = data.termsAccepted || false;
    const newDnsSetting = data.dnsSetting || 'disabled';
    if (newDnsSetting !== inMemoryDnsSetting) {
        inMemoryDnsSetting = newDnsSetting;
        applyDnsSetting();
    }
    blacklistsLoaded = true;
    console.log("Estado foi atualizado na memória. Termos aceitos:", inMemoryTermsAccepted);
    console.timeEnd("Tempo para carregar do armazenamento para a memória");
}

async function initializeExtension() {
    console.log("Inicializando a extensão após aceitar os termos...");
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

    console.time("Tempo para salvar estado inicial no armazenamento");
    const initialData = {
        mainBlacklist: allMaliciousDomains,
        userBlacklist: [],
        userWhitelist: [],
        blockedCategories: TARGET_CATEGORIES,
        isCustomListEnabled: true,
        isEnabled: true,
        termsAccepted: true,
        dnsSetting: 'disabled'
    };
    await chrome.storage.local.set(initialData);
    console.timeEnd("Tempo para salvar estado inicial no armazenamento");

    console.log(`Carregamento do disco concluído. Total de ${Object.keys(allMaliciousDomains).length} domínios.`);
    await updateInMemoryState();
    activateBlocking();
    console.log("Inicialização concluída.");
}

function activateBlocking() {
    if (!chrome.webNavigation.onBeforeNavigate.hasListener(handleNavigation)) {
        chrome.webNavigation.onBeforeNavigate.addListener(handleNavigation);
        console.log("Bloqueio de navegação ativado.");
    }
}

function findBlockedDomain(domain) {
    const domainParts = domain.split('.');
    for (let i = 0; i <= domainParts.length - 2; i++) {
        const domainToCheck = domainParts.slice(i).join('.');

        if (inMemoryIsCustomListEnabled && inMemoryUserBlacklist.includes(domainToCheck)) {
            return { domain: domainToCheck, category: 'personalizada' };
        }

        const category = inMemoryMainBlacklist[domainToCheck];
        if (category && inMemoryBlockedCategories.includes(category)) {
            return { domain: domainToCheck, category: category };
        }
    }
    return null;
}

async function handleNavigation(details) {
    if (details.frameId !== 0 || !inMemoryTermsAccepted) {
        return;
    }

    if (!blacklistsLoaded) {
        await updateInMemoryState();
    }

    if (!inMemoryIsEnabled) {
        return;
    }

    const url = new URL(details.url);
    const domain = url.hostname.startsWith('www.') ? url.hostname.substring(4) : url.hostname;

    if (inMemoryUserWhitelist.includes(domain)) {
        return;
    }

    const blockReason = findBlockedDomain(domain);

    if (blockReason) {
        const blockedPageUrl = chrome.runtime.getURL(`blocked.html?domain=${blockReason.domain}&category=${blockReason.category}&originalUrl=${encodeURIComponent(details.url)}`);
        chrome.tabs.update(details.tabId, { url: blockedPageUrl });
    }
}

chrome.runtime.onInstalled.addListener(async (details) => {
    console.log("Evento 'onInstalled' disparado:", details.reason);
    await updateInMemoryState();

    if (details.reason === 'install' && !inMemoryTermsAccepted) {
        const welcomeUrl = chrome.runtime.getURL('welcome.html');
        chrome.tabs.create({ url: welcomeUrl });
    } else if (inMemoryTermsAccepted) {
        activateBlocking();
        applyDnsSetting();
    }
});

chrome.runtime.onStartup.addListener(async () => {
    console.log("Evento 'onStartup' (navegador iniciado).");
    await updateInMemoryState();
    if (inMemoryTermsAccepted) {
        activateBlocking();
        applyDnsSetting();
    }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace !== 'local') return;
    console.log("Configurações foram modificadas, atualizando a memória...");
    updateInMemoryState();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'termsAccepted') {
        initializeExtension().then(() => {
            sendResponse({ status: "done" });
        });
        return true;
    }

    if (request.action === 'whitelistAndRedirect') {
        if (request.domain && !inMemoryUserWhitelist.includes(request.domain)) {
            inMemoryUserWhitelist.push(request.domain);
        }
        if (sender.tab && sender.tab.id) {
            chrome.tabs.update(sender.tab.id, { url: request.url });
        }
    }
});
