const Canvas = require('canvas');

module.exports = async (member, config) => {
    const canvas = Canvas.createCanvas(1024, 450);
    const ctx = canvas.getContext('2d');

    // 1. Fond
    try {
        const bgUrl = config.backgroundUrl || "https://htmlcolorcodes.com/assets/images/colors/black-color-solid-background-1920x1080.png"; 
        const background = await Canvas.loadImage(bgUrl);
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    } catch (e) {
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Overlay sombre
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const textColor = config.textColor || '#ffffff';

    // --- FONCTION INTELLIGENTE AUTO-FIT ---
    const applyAutoFitText = (text, maxWidth, initialFontSize) => {
        let fontSize = initialFontSize;
        ctx.font = `bold ${fontSize}px sans-serif`;
        // Tant que le texte est plus grand que la largeur max, on réduit la police
        while (ctx.measureText(text).width > maxWidth && fontSize > 10) {
            fontSize -= 5;
            ctx.font = `bold ${fontSize}px sans-serif`;
        }
        return fontSize;
    };

    // 2. TEXTE PRINCIPAL (TITRE)
    const titleText = config.imageTitle || "BIENVENUE";
    // On calcule la taille pour qu'il ne dépasse pas 900px de large (marge de sécurité)
    applyAutoFitText(titleText, 900, 72); 
    
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.fillText(titleText, canvas.width / 2, 300);

    // 3. PSEUDO DU MEMBRE
    const username = member.user.username.toUpperCase();
    applyAutoFitText(username, 900, 50); // Max width 900px, taille départ 50px
    ctx.fillText(username, canvas.width / 2, 360);

    // 4. Compteur
    ctx.font = '24px sans-serif'; // Pas besoin d'autofit ici
    ctx.fillText(`Le membre compte désormais ${member.guild.memberCount} membres`, canvas.width / 2, 410);

    // 5. Avatar
    if (config.showAvatar) {
        ctx.beginPath();
        ctx.arc(canvas.width / 2, 150, 105, 0, Math.PI * 2, true);
        ctx.fillStyle = textColor;
        ctx.fill();
        ctx.closePath();

        ctx.beginPath();
        ctx.arc(canvas.width / 2, 150, 100, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();

        const avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 512 });
        const avatar = await Canvas.loadImage(avatarUrl);
        ctx.drawImage(avatar, (canvas.width / 2) - 100, 50, 200, 200);
    }

    return canvas.toBuffer();
};