document.addEventListener('DOMContentLoaded', () => {
    const toggleSwitch = document.getElementById('toggleSwitch');
    const statusText = document.getElementById('statusText');
    const domainInput = document.getElementById('domainInput');
    const addDomainBtn = document.getElementById('addDomainBtn');
    const customBlacklistUI = document.getElementById('customBlacklistUI');

    chrome.storage.local.get('isEnabled', ({ isEnabled }) => {
        isEnabled = true;
        toggleSwitch.checked = !!isEnabled;
        statusText.textContent = isEnabled ? 'Ativado' : 'Desativado';
    });

    toggleSwitch.addEventListener('change', () => {
        const newState = toggleSwitch.checked;
        chrome.storage.local.set({ isEnabled: newState }, () => {
            statusText.textContent = newState ? 'Ativado' : 'Desativado';
            console.log(`Estado da extensão alterado para: ${newState}`);
        });
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
                removeBtn.addEventListener('click', () => {
                    removeDomain(domain);
                });

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
        const domain = domainInput.value.trim().toLowerCase();
        if (domain && domain.includes('.')) {
            chrome.storage.local.get({ userBlacklist: [] }, ({ userBlacklist }) => {
                if (!userBlacklist.includes(domain)) {
                    const updatedBlacklist = [...userBlacklist, domain];
                    chrome.storage.local.set({ userBlacklist: updatedBlacklist }, () => {
                        renderBlacklist(updatedBlacklist);
                        domainInput.value = '';
                    });
                }
            });
        } else {
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
        if (e.key === 'Enter') {
            addDomain();
        }
    });
});
