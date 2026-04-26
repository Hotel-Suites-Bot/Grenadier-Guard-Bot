const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bgc')
        .setDescription('Background check')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to check')
                .setRequired(true)
        ),

    async execute(interaction) {
        const user = interaction.options.getUser('user');

        const embed = new EmbedBuilder()
            .setTitle('🔍 Background Check')
            .addFields(
                { name: 'User', value: `<@${user.id}>` },
                { name: 'Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>` }
            )
            .setColor('Purple');

        interaction.reply({ embeds: [embed] });
    }
};
