const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    SlashCommandBuilder,
    REST,
    Routes
} = require("discord.js");

const noblox = require("noblox.js");

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// ENV VARIABLES
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const EVENT_CHANNEL_ID = process.env.EVENT_CHANNEL_ID;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;
const REQUIRED_ROLE_ID = process.env.REQUIRED_ROLE_ID;

// BGC CONFIG
const BLACKLISTED_GROUPS = [];
const MAIN_GROUP_ID = 35365203;
const MIN_ACCOUNT_AGE = 60;
const MIN_FRIENDS = 10;

// ACTIVE EVENT
let activeEvent = null;

// SAFETY CHECK
["TOKEN","CLIENT_ID","GUILD_ID"].forEach(v => {
    if (!process.env[v]) {
        console.error(`Missing ENV: ${v}`);
        process.exit(1);
    }
});

client.once("ready", async () => {
    console.log(`${client.user.tag} online`);

    const commands = [
        new SlashCommandBuilder()
            .setName("bgc")
            .setDescription("Run a Roblox background check")
            .addStringOption(option =>
                option.setName("username")
                    .setDescription("Roblox username")
                    .setRequired(true)
            ),

        new SlashCommandBuilder()
            .setName("event")
            .setDescription("Event system")
            .addSubcommand(sub =>
                sub.setName("host")
                    .setDescription("Host an event")
                    .addStringOption(o => o.setName("eventname").setDescription("Event name").setRequired(true))
                    .addStringOption(o => o.setName("cohost").setDescription("Cohost").setRequired(true))
                    .addStringOption(o => o.setName("rules").setDescription("Rules").setRequired(true))
                    .addStringOption(o => o.setName("invite").setDescription("Game invite").setRequired(true))
            )
            .addSubcommand(sub =>
                sub.setName("start")
                    .setDescription("Lock the event")
            )
            .addSubcommand(sub =>
                sub.setName("end")
                    .setDescription("End and log event")
                    .addIntegerOption(o => o.setName("attendees").setRequired(true).setDescription("Attendees count"))
                    .addStringOption(o => o.setName("passers").setRequired(true).setDescription("Passers names"))
                    .addIntegerOption(o => o.setName("failed").setRequired(true).setDescription("Failed count"))
                    .addAttachmentOption(o => o.setName("proof").setRequired(true).setDescription("Proof image"))
            )
    ].map(cmd => cmd.toJSON());

    const rest = new REST({ version: "10" }).setToken(TOKEN);

    await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: commands }
    );

    console.log("Slash commands registered");
});

client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // ROLE CHECK
    if (!interaction.member.roles.cache.has(REQUIRED_ROLE_ID)) {
        return interaction.reply({
            content: "❌ You do not have permission.",
            ephemeral: true
        });
    }

    // ---------------- BGC ----------------
    if (interaction.commandName === "bgc") {
        const username = interaction.options.getString("username");

        await interaction.reply({ content: "🔍 Running BGC...", ephemeral: true });

        try {
            const userId = await noblox.getIdFromUsername(username);
            const userInfo = await noblox.getPlayerInfo(userId);
            const groups = await noblox.getGroups(userId);
            const friends = await noblox.getFriends(userId);

            const created = new Date(userInfo.created);
            const ageDays = Math.floor((Date.now() - created) / 86400000);

            const blacklisted = groups.find(g => BLACKLISTED_GROUPS.includes(g.Id));
            const inMain = groups.find(g => g.Id === MAIN_GROUP_ID);

            let flags = [];
            let color = 0x00ff00;

            if (blacklisted) {
                flags.push(`🔴 RED FLAG: In blacklisted group (${blacklisted.Name})`);
                color = 0xff0000;
            }

            if (ageDays < MIN_ACCOUNT_AGE) {
                flags.push(`🟠 ORANGE FLAG: Under ${MIN_ACCOUNT_AGE} days`);
                color = 0xffa500;
            }

            if (!inMain) {
                flags.push(`🟠 ORANGE FLAG: Not in main group`);
                color = 0xffa500;
            }

            if (friends.length < MIN_FRIENDS) {
                flags.push(`🟠 ORANGE FLAG: Low friends (${friends.length})`);
                color = 0xffa500;
            }

            if (flags.length === 0) {
                flags.push("🟢 GREEN FLAG: ALL CLEAR");
            }

            const embed = new EmbedBuilder()
                .setTitle("Military Background Check")
                .setColor(color)
                .addFields(
                    { name: "Username", value: username, inline: true },
                    { name: "User ID", value: `${userId}`, inline: true },
                    { name: "Account Age", value: `${ageDays} days`, inline: true },
                    { name: "Friends", value: `${friends.length}`, inline: true },
                    { name: "Profile", value: `https://www.roblox.com/users/${userId}/profile` },
                    { name: "Flags", value: flags.join("\n") }
                )
                .setFooter({ text: "Military Screening System" })
                .setTimestamp();

            interaction.editReply({ embeds: [embed] });

        } catch (err) {
            console.error(err);
            interaction.editReply("❌ Failed to fetch Roblox data.");
        }
    }

    // ---------------- EVENT SYSTEM ----------------
    if (interaction.commandName === "event") {
        const sub = interaction.options.getSubcommand();

        // HOST
        if (sub === "host") {
            const eventChannel = interaction.guild.channels.cache.get(EVENT_CHANNEL_ID);

            const embed = new EmbedBuilder()
                .setTitle("Military Event")
                .addFields(
                    { name: "Host", value: `${interaction.user}`, inline: true },
                    { name: "Cohost", value: interaction.options.getString("cohost"), inline: true },
                    { name: "Event Name", value: interaction.options.getString("eventname") },
                    { name: "Rules", value: interaction.options.getString("rules") },
                    { name: "Locking In", value: "🟢 OPEN", inline: true },
                    { name: "Game Invite", value: interaction.options.getString("invite") }
                )
                .setTimestamp();

            const msg = await eventChannel.send({ embeds: [embed] });

            activeEvent = {
                messageId: msg.id,
                channelId: eventChannel.id,
                host: interaction.user.tag,
                cohost: interaction.options.getString("cohost"),
                eventName: interaction.options.getString("eventname")
            };

            return interaction.reply({ content: "✅ Event posted.", ephemeral: true });
        }

        // START
        if (sub === "start") {
            if (!activeEvent) {
                return interaction.reply({ content: "❌ No active event.", ephemeral: true });
            }

            const channel = interaction.guild.channels.cache.get(activeEvent.channelId);
            const msg = await channel.messages.fetch(activeEvent.messageId);

            const embed = EmbedBuilder.from(msg.embeds[0]);

            embed.spliceFields(4, 1, {
                name: "Locking In",
                value: "🔒 LOCKED!",
                inline: true
            });

            await msg.edit({ embeds: [embed] });

            return interaction.reply({ content: "🔒 Event locked.", ephemeral: true });
        }

        // END
        if (sub === "end") {
            if (!activeEvent) {
                return interaction.reply({ content: "❌ No active event.", ephemeral: true });
            }

            const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);

            const embed = new EmbedBuilder()
                .setTitle("Event Log")
                .addFields(
                    { name: "Host", value: activeEvent.host, inline: true },
                    { name: "Cohost", value: activeEvent.cohost, inline: true },
                    { name: "Event Name", value: activeEvent.eventName },
                    { name: "Attendees Count", value: `${interaction.options.getInteger("attendees")}`, inline: true },
                    { name: "Passers Names", value: interaction.options.getString("passers") },
                    { name: "Failed Count", value: `${interaction.options.getInteger("failed")}`, inline: true }
                )
                .setImage(interaction.options.getAttachment("proof").url)
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });

            activeEvent = null;

            return interaction.reply({ content: "✅ Event logged.", ephemeral: true });
        }
    }
});

client.login(TOKEN);
