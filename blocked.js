document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const domain = params.get('domain');
    const category = params.get('category');

    document.getElementById('domain').textContent = domain || 'desconhecido';
    document.getElementById('category').textContent = category || 'risco de segurança';
});