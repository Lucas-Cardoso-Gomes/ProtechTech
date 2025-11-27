const LOCAL_NEWS = [
    {
        title: "Alerta: Novo Golpe do Pix Agendado",
        date: "27/11/2025",
        description: "Criminosos enviam comprovante de agendamento como se fosse transferência real. Sempre confira o extrato antes de liberar produtos."
    },
    {
        title: "Cuidado com o Golpe da 'Mão Fantasma'",
        date: "26/11/2025",
        description: "Malware permite que hackers controlem seu celular remotamente. Evite instalar apps fora da loja oficial e não clique em links suspeitos."
    },
    {
        title: "Falso Leilão do DETRAN Faz Vítimas",
        date: "25/11/2025",
        description: "Sites falsos simulam leilões de veículos com preços muito baixos. Verifique sempre o edital oficial no site do governo."
    },
    {
        title: "Phishing: E-mail Falso da Receita Federal",
        date: "24/11/2025",
        description: "Golpistas enviam e-mails sobre pendências no CPF para roubar dados. A Receita não envia links por e-mail."
    },
    {
        title: "Golpe do WhatsApp: Pedido de Dinheiro",
        date: "23/11/2025",
        description: "Se um amigo pedir dinheiro urgente por mensagem, desconfie. Ligue para a pessoa para confirmar a identidade antes de transferir."
    },
    {
        title: "SMS de 'Encomenda Taxada'",
        date: "22/11/2025",
        description: "Mensagens falsas dos Correios pedem pagamento de taxa para liberar encomenda. Use apenas o app oficial para rastreio."
    },
    {
        title: "Golpe da Falsa Central de Atendimento",
        date: "21/11/2025",
        description: "Falsos atendentes ligam informando compra suspeita e pedem senhas ou transferências. Bancos nunca pedem isso por telefone."
    },
    {
        title: "Ofertas de Emprego 'Tarefa Remota'",
        date: "20/11/2025",
        description: "Promessas de dinheiro fácil por avaliar produtos ou curtir vídeos são esquema de pirâmide ou roubo de dados."
    },
    {
        title: "Golpe do Presente Misterioso",
        date: "19/11/2025",
        description: "Entregador chega com presente surpresa mas cobra taxa de entrega na maquininha, que tem visor quebrado ou passa valor alto."
    },
    {
        title: "Boletos Falsos de Contas de Consumo",
        date: "18/11/2025",
        description: "Códigos de barras alterados desviam o pagamento de contas de luz e internet. Sempre confira o beneficiário no momento do pagamento."
    }
];

const CONTAINER = document.getElementById('news-container');

function renderNews() {
    CONTAINER.innerHTML = '';
    
    LOCAL_NEWS.forEach(item => {
        const newsItem = document.createElement('div');
        newsItem.className = 'news-item';

        newsItem.innerHTML = `
            <div class="news-item-title">
                ${item.title}
            </div>
            <div class="news-item-meta">
                <span>📅 ${item.date}</span>
                <span>• Alerta de Segurança</span>
            </div>
            <div class="news-item-description">
                ${item.description}
            </div>
        `;
        
        CONTAINER.appendChild(newsItem);
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', renderNews);
