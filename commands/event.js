const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

let activeEvent = null;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('event')
        .setDescription('Event system')

        // HOST
        .addSubcommand(sub =>
            sub.setName('host')
                .setDescription('Host an event')

                // REQUIRED FIRST
                .addUserOption(option =>
                    option.setName('host')
                        .setDescription('Event host')
                        .setRequired(true)
                )

                // OPTIONAL AFTER
                .addStringOption(option =>
                    option.setName('map')
                        .setDescription('Map')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName('time')
                        .setDescription('Time')
                        .setRequired(false)
                )
        )

        // START
        .addSubcommand(sub =>
            sub.setName('start')
                .setDescription('Start event')
        )

        // END
        .addSubcommand(sub =>
            sub.setName('end')
                .setDescription('End event')

                .addStringOption(option =>
                    option.setName('result')
                        .setDescription('Result')
                        .setRequired(true)
                )

                .addStringOption(option =>
                    option.setName('notes')
                        .setDescription('Notes')
                        .setRequired(false)
                )
        ),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();

        // HOST
        if (sub === 'host') {
            const host = interaction.options.getUser('host');
            const map = interaction.options.getString('map') || 'Not set';
            const time = interaction.options.getString('time') || 'Not set';

            activeEvent = {
                host: host.id,
                map,
                time,
                started: false
            };

            const embed = new EmbedBuilder()
                .setTitle('📢 Event Hosted')
                .addFields(
                    { name: 'Host', value: `<@${host.id}>` },
                    { name: 'Map', value: map },
                    { name: 'Time', value: time }
                )
                .setColor('Blue');

            return interaction.reply({ embeds: [embed] });
        }

        // START
        if (sub === 'start') {
            if (!activeEvent) {
                return interaction.reply({ content: 'No active event.', ephemeral: true });
            }

            activeEvent.started = true;

            const embed = new EmbedBuilder()
                .setTitle('🟢 Event Started')
                .setDescription('The event is now live!')
                .setColor('Green');

            return interaction.reply({ embeds: [embed] });
        }

        // END
        if (sub === 'end') {
            if (!activeEvent) {
                return interaction.reply({ content: 'No active event.', ephemeral: true });
            }

            const result = interaction.options.getString('result');
            const notes = interaction.options.getString('notes') || 'None';

            const embed = new EmbedBuilder()
                .setTitle('🔴 Event Ended')
                .addFields(
                    { name: 'Result', value: result },
                    { name: 'Notes', value: notes }
                )
                .setColor('Red');

            activeEvent = null;

            return interaction.reply({ embeds: [embed] });
        }
    }
};
