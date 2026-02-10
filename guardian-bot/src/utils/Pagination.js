const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

class Pagination {
    constructor(pages, timeout = 60000) {
        this.pages = pages;
        this.timeout = timeout;
        this.index = 0;
    }

    getButtons(index) {
        return new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('prev')
                .setLabel('⬅️')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(index === 0),
            new ButtonBuilder()
                .setCustomId('page_info')
                .setLabel(`Page ${index + 1} / ${this.pages.length}`)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId('next')
                .setLabel('➡️')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(index === this.pages.length - 1)
        );
    }

    async send(interaction) {
        if (!this.pages.length) return;

        const response = await interaction.reply({
            embeds: [this.pages[this.index]],
            components: [this.getButtons(this.index)],
            fetchReply: true
        });

        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: this.timeout
        });

        collector.on('collect', async (i) => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: "Vous ne pouvez pas contrôler cette pagination.", ephemeral: true });
            }

            if (i.customId === 'prev') this.index--;
            if (i.customId === 'next') this.index++;

            await i.update({
                embeds: [this.pages[this.index]],
                components: [this.getButtons(this.index)]
            });
        });

        collector.on('end', () => {
            const disabledRow = new ActionRowBuilder().addComponents(
                this.getButtons(this.index).components.map(b => ButtonBuilder.from(b).setDisabled(true))
            );
            response.edit({ components: [disabledRow] }).catch(() => {});
        });
    }
}

module.exports = Pagination;