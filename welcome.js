document.addEventListener('DOMContentLoaded', () => {
    const acceptButton = document.getElementById('acceptButton');
    const acceptanceContainer = document.getElementById('acceptance-container');
    const statusMessage = document.getElementById('statusMessage');

    chrome.storage.local.get(['termsAccepted'], ({ termsAccepted }) => {
        if (termsAccepted) {
            if (acceptanceContainer) {
                acceptanceContainer.style.display = 'none';
            }
        }
    });

    if (acceptButton) {
        acceptButton.addEventListener('click', () => {
            acceptButton.style.display = 'none';
            statusMessage.textContent = 'O bloqueador está sendo instalado e será inicializado dentro de 1 minuto. Obrigado!';
            statusMessage.style.display = 'block';

            chrome.runtime.sendMessage({ action: "termsAccepted" }, () => {
                console.log("Mensagem de aceitação enviada para o background script.");
            });
        });
    }
});