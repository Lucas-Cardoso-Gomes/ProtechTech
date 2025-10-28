document.addEventListener('DOMContentLoaded', () => {
    const toggleSwitch = document.getElementById('toggleSwitch');
    const statusText = document.getElementById('statusText');

    const domainInput = document.getElementById('domainInput');
    const addDomainBtn = document.getElementById('addDomainBtn');
    const customBlacklistUI = document.getElementById('customBlacklistUI');
    const whitelistDomainInput = document.getElementById('whitelistDomainInput');
    const addWhitelistDomainBtn = document.getElementById('addWhitelistDomainBtn');
    const customWhitelistUI = document.getElementById('customWhitelistUI');
    const settingsBtn = document.getElementById('settingsBtn');
    const backBtn = document.getElementById('backBtn');
    const mainView = document.getElementById('main-view');
    const settingsView = document.getElementById('settings-view');
    const termsLink = document.getElementById('termsLink');

    const categoryTogglesContainer = document.getElementById('category-toggles');

    const dnsRadios = document.querySelectorAll('input[name="dns-option"]');

    chrome.storage.local.get('dnsSetting', ({ dnsSetting }) => {
        if (dnsSetting) {
            document.getElementById(`dns-${dnsSetting}`).checked = true;
        }
    });

    dnsRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            chrome.storage.local.set({ dnsSetting: radio.value });
        });
    });

    chrome.storage.local.get('isEnabled', ({ isEnabled }) => {
        toggleSwitch.checked = !!isEnabled;
        statusText.textContent = isEnabled ? 'Ativado' : 'Desativado';
    });

    toggleSwitch.addEventListener('change', () => {
        const newState = toggleSwitch.checked;
        chrome.storage.local.set({ isEnabled: newState }, () => {
            statusText.textContent = newState ? 'Ativado' : 'Desativado';
        });
    });

    settingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        mainView.classList.add('hidden');
        settingsView.classList.remove('hidden');
    });

    backBtn.addEventListener('click', (e) => {
        e.preventDefault();
        settingsView.classList.add('hidden');
        mainView.classList.remove('hidden');
    });

    termsLink.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') });
    });

    const renderBlacklist = (blacklist) => {
        customBlacklistUI.innerHTML = '';
        if (blacklist && blacklist.length > 0) {
            blacklist.forEach(domain => {
                const li = document.createElement('li');
                li.textContent = domain;
                const removeBtn = document.createElement('button');
                removeBtn.textContent = 'Remover';
                removeBtn.className = 'remove-btn';
                removeBtn.addEventListener('click', () => removeDomain(domain));
                li.appendChild(removeBtn);
                customBlacklistUI.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'Nenhum domínio adicionado.';
            li.style.fontStyle = 'italic';
            li.style.color = '#888';
            customBlacklistUI.appendChild(li);
        }
    };

    const addDomain = () => {
        let url = domainInput.value.trim().toLowerCase();
        if (!url.startsWith('http')) {
            url = `https://${url}`;
        }
        try {
            const domain = new URL(url).hostname;
            chrome.storage.local.get({ userBlacklist: [] }, ({ userBlacklist }) => {
                if (!userBlacklist.includes(domain)) {
                    const updatedBlacklist = [...userBlacklist, domain];
                    chrome.storage.local.set({ userBlacklist: updatedBlacklist }, () => {
                        renderBlacklist(updatedBlacklist);
                        domainInput.value = '';
                    });
                }
            });
        } catch (error) {
            alert("Por favor, insira um domínio válido (ex: exemplo.com).");
        }
    };

    const removeDomain = (domainToRemove) => {
        chrome.storage.local.get({ userBlacklist: [] }, ({ userBlacklist }) => {
            const updatedBlacklist = userBlacklist.filter(d => d !== domainToRemove);
            chrome.storage.local.set({ userBlacklist: updatedBlacklist }, () => {
                renderBlacklist(updatedBlacklist);
            });
        });
    };

    chrome.storage.local.get({ userBlacklist: [] }, ({ userBlacklist }) => {
        renderBlacklist(userBlacklist);
    });

    addDomainBtn.addEventListener('click', addDomain);
    domainInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addDomain();
    });

    const renderWhitelist = (whitelist) => {
        customWhitelistUI.innerHTML = '';
        if (whitelist && whitelist.length > 0) {
            whitelist.forEach(domain => {
                const li = document.createElement('li');
                li.textContent = domain;
                const removeBtn = document.createElement('button');
                removeBtn.textContent = 'Remover';
                removeBtn.className = 'remove-btn';
                removeBtn.addEventListener('click', () => removeWhitelistDomain(domain));
                li.appendChild(removeBtn);
                customWhitelistUI.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'Nenhum domínio adicionado.';
            li.style.fontStyle = 'italic';
            li.style.color = '#888';
            customWhitelistUI.appendChild(li);
        }
    };

    const addWhitelistDomain = () => {
        let url = whitelistDomainInput.value.trim().toLowerCase();
        if (!url.startsWith('http')) {
            url = `https://${url}`;
        }
        try {
            const domain = new URL(url).hostname;
            chrome.storage.local.get({ userWhitelist: [] }, ({ userWhitelist }) => {
                if (!userWhitelist.includes(domain)) {
                    const updatedWhitelist = [...userWhitelist, domain];
                    chrome.storage.local.set({ userWhitelist: updatedWhitelist }, () => {
                        renderWhitelist(updatedWhitelist);
                        whitelistDomainInput.value = '';
                    });
                }
            });
        } catch (error) {
            alert("Por favor, insira um domínio válido (ex: exemplo.com).");
        }
    };

    const removeWhitelistDomain = (domainToRemove) => {
        chrome.storage.local.get({ userWhitelist: [] }, ({ userWhitelist }) => {
            const updatedWhitelist = userWhitelist.filter(d => d !== domainToRemove);
            chrome.storage.local.set({ userWhitelist: updatedWhitelist }, () => {
                renderWhitelist(updatedWhitelist);
            });
        });
    };

    chrome.storage.local.get({ userWhitelist: [] }, ({ userWhitelist }) => {
        renderWhitelist(userWhitelist);
    });

    addWhitelistDomainBtn.addEventListener('click', addWhitelistDomain);
    whitelistDomainInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addWhitelistDomain();
    });

    const categories = [
        'phishing', 'malware', 'bitcoin', 'cryptojacking',
        'ddos', 'fakenews', 'hacking', 'gambling'
    ];

    const createToggle = (labelText, isChecked, onToggle) => {
        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'category-toggle';

        const label = document.createElement('span');
        label.textContent = labelText;

        const switchLabel = document.createElement('label');
        switchLabel.className = 'switch';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = isChecked;
        input.addEventListener('change', () => onToggle(input.checked));

        const slider = document.createElement('span');
        slider.className = 'slider round';

        switchLabel.appendChild(input);
        switchLabel.appendChild(slider);
        toggleContainer.appendChild(label);
        toggleContainer.appendChild(switchLabel);
        return toggleContainer;
    };

    const renderToggles = ({ blockedCategories = [], isCustomListEnabled = true }) => {
        categoryTogglesContainer.innerHTML = '<h3>Bloqueio por Categoria</h3>';
        
        const customListToggle = createToggle('Lista Personalizada', isCustomListEnabled, (isChecked) => {
            chrome.storage.local.set({ isCustomListEnabled: isChecked });
        });
        categoryTogglesContainer.appendChild(customListToggle);

        let currentBlocked = [...blockedCategories];
        categories.forEach(category => {
            const isBlocked = currentBlocked.includes(category);
            const categoryToggle = createToggle(
                category.charAt(0).toUpperCase() + category.slice(1),
                isBlocked,
                (isChecked) => {
                    if (isChecked) {
                        if (!currentBlocked.includes(category)) {
                            currentBlocked.push(category);
                        }
                    } else {
                        currentBlocked = currentBlocked.filter(c => c !== category);
                    }
                    chrome.storage.local.set({ blockedCategories: currentBlocked });
                }
            );
            categoryTogglesContainer.appendChild(categoryToggle);
        });
    };

    chrome.storage.local.get(['blockedCategories', 'isCustomListEnabled'], renderToggles);
});
