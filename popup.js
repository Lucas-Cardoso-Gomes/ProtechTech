document.addEventListener('DOMContentLoaded', () => {
    const toggleSwitch = document.getElementById('toggleSwitch');
    const statusText = document.getElementById('statusText');

    chrome.storage.local.get('isEnabled', ({ isEnabled }) => {
        toggleSwitch.checked = isEnabled;
        statusText.textContent = isEnabled ? 'Ativado' : 'Desativado';
    });

    toggleSwitch.addEventListener('change', () => {
        const newState = toggleSwitch.checked;
        chrome.storage.local.set({ isEnabled: newState }, () => {
            statusText.textContent = newState ? 'Ativado' : 'Desativado';
            
            console.log(`Estado da extensão alterado para: ${newState}`);
        });
    });
});