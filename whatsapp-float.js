// Manejo del botón flotante de WhatsApp
document.addEventListener('DOMContentLoaded', () => {
    const whatsappFloat = document.getElementById('whatsapp-float');
    if (whatsappFloat) {
        whatsappFloat.addEventListener('click', (e) => {
            e.preventDefault();
            const message = encodeURIComponent('¡Hola! Me gustaría saber más sobre los productos de Naranja Mandarina.');
            window.open(`https://wa.me/573152791288?text=${message}`, '_blank');
        });
    }
});