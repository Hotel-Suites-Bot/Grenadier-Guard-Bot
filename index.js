const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    SlashCommandBuilder,
    REST,
    Routes
} = require("discord.js");

const noblox = require("noblox.js");

// ================= ENV =================
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const EVENT_CHANNEL_ID = process.env.EVENT_CHANNEL_ID;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;
const REQUIRED_ROLE_ID = process.env.REQUIRED_ROLE_ID;

// ================= CONFIG =================
const BLACKLISTED_GROUPS = [1];
const MAIN_GROUP_ID = 35365203;

const MIN_ACCOUNT_AGE = 60;
const MIN_FRIENDS = 10;

// ================= CLIENT =================
const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// ================= ACTIVE EVENT =================
let activeEvent = null;

// ================= SAFETY CHECK =================
["TOKEN","CLIENT_ID","GUILD_ID"].forEach(v => {
    if (!process.env[v]) {
        console.error(`Missing ENV: ${v}`);
        process.exit(1);
    }
});

// ================= READY =================
client.once("ready", async () => {
    console.log(`${client.user.tag} online`);

    const commands = [
        new SlashCommandBuilder()
            .setName("bgc")
            .setDescription("Roblox background check")
            .addStringOption(o =>
                o.setName("username")
                    .setDescription("Roblox username")
                    .setRequired(true)
            ),

        new SlashCommandBuilder()
            .setName("event")
            .setDescription("Event system")
            .addSubcommand(s =>
                s.setName("host")
                    .setDescription("Host event")
                    .addStringOption(o => o.setName("eventname").setRequired(true))
                    .addStringOption(o => o.setName("cohost").setRequired(true))
                    .addStringOption(o => o.setName("rules").setRequired(true))
                    .addStringOption(o => o.setName("invite").setRequired(true))
            )
            .addSubcommand(s =>
                s.setName("start").setDescription("Lock event")
            )
            .addSubcommand(s =>
                s.setName("end")
                    .setDescription("End event")
                    .addIntegerOption(o => o.setName("attendees").setRequired(true))
                    .addStringOption(o => o.setName("passers").setRequired(true))
                    .addIntegerOption(o => o.setName("failed").setRequired(true))
                    .addAttachmentOption(o => o.setName("proof").setRequired(true))
            )
    ].map(c => c.toJSON());

    const rest = new REST({ version: "10" }).setToken(TOKEN);

    await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: commands }
    );

    console.log("Commands loaded");
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // ROLE CHECK
    if (!interaction.member.roles.cache.has(REQUIRED_ROLE_ID)) {
        return interaction.reply({
            content: "❌ No permission.",
            ephemeral: true
        });
    }

    // ================= BGC =================
    if (interaction.commandName === "bgc") {
        const username = interaction.options.getString("username");

        await interaction.reply({
            content: "🔍 Running BGC...",
            ephemeral: true
        });

        try {
            // timeout helper
            const timeout = (p, ms = 8000) =>
                Promise.race([
                    p,
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error("Timeout")), ms)
                    )
                ]);

            const userId = await timeout(noblox.getIdFromUsername(username));
            const userInfo = await timeout(noblox.getPlayerInfo(userId));
            const groups = await timeout(noblox.getGroups(userId));
            const friends = await timeout(noblox.getFriends(userId));

            const ageDays = Math.floor(
                (Date.now() - new Date(userInfo.created)) / 86400000
            );

            const blacklisted = groups.find(g =>
                BLACKLISTED_GROUPS.includes(g.Id)
            );

            const inMain = groups.find(g =>
                g.Id === MAIN_GROUP_ID
            );

            let flags = [];
            let color = 0x00ff00;

            if (blacklisted) {
                flags.push(`🔴 RED FLAG: Blacklisted group (${blacklisted.Name})`);
                color = 0xff0000;
            }

            if (ageDays < MIN_ACCOUNT_AGE) {
                flags.push(`🟠 ORANGE: Account under ${MIN_ACCOUNT_AGE} days`);
                color = 0xffa500;
            }

            if (!inMain) {
                flags.push(`🟠 ORANGE: Not in main group`);
                color = 0xffa500;
            }

            if (friends.length < MIN_FRIENDS) {
                flags.push(`🟠 ORANGE: Low friends (${friends.length})`);
                color = 0xffa500;
            }

            if (flags.length === 0) {
                flags.push("🟢 GREEN: ALL CLEAR");
            }

            const embed = new EmbedBuilder()
                .setTitle("MILITARY BACKGROUND CHECK")
                .setColor(color)
                .addFields(
                    { name: "Username", value: username, inline: true },
                    { name: "User ID", value: `${userId}`, inline: true },
                    { name: "Account Age", value: `${ageDays} days`, inline: true },
                    { name: "Friends", value: `${friends.length}`, inline: true },
                    {
                        name: "Profile",
                        value: `https://www.roblox.com/users/${userId}/profile`
                    },
                    {
                        name: "FLAGS",
                        value: flags.join("\n")
                    }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (err) {
            console.error(err);

            await interaction.editReply({
                content: "❌ BGC failed (timeout / invalid user / Roblox error)."
            });
        }
    }

    // ================= EVENT =================
    if (interaction.commandName === "event") {
        const sub = interaction.options.getSubcommand();

        // HOST
        if (sub === "host") {
            const channel = interaction.guild.channels.cache.get(EVENT_CHANNEL_ID);

            const embed = new EmbedBuilder()
                .setTitle("MILITARY EVENT")
                .addFields(
                    { name: "Host", value: `${interaction.user}` },
                    { name: "Cohost", value: interaction.options.getString("cohost") },
                    { name: "Event Name", value: interaction.options.getString("eventname") },
                    { name: "Rules", value: interaction.options.getString("rules") },
                    { name: "Locking In", value: "🟢 OPEN" },
                    { name: "Game Invite", value: interaction.options.getString("invite") }
                )
                .setTimestamp();

            const msg = await channel.send({ embeds: [embed] });

            activeEvent = {
                id: msg.id,
                channel: channel.id,
                host: interaction.user.tag,
                cohost: interaction.options.getString("cohost"),
                name: interaction.options.getString("eventname")
            };

            return interaction.reply({
                content: "✅ Event hosted.",
                ephemeral: true
            });
        }

        // START
        if (sub === "start") {
            if (!activeEvent)
                return interaction.reply({ content: "❌ No event.", ephemeral: true });

            const channel = interaction.guild.channels.cache.get(activeEvent.channel);
            const msg = await channel.messages.fetch(activeEvent.id);

            const embed = EmbedBuilder.from(msg.embeds[0]);

            embed.spliceFields(4, 1, {
                name: "Locking In",
                value: "🔒 LOCKED",
                inline: false
            });

            await msg.edit({ embeds: [embed] });

            return interaction.reply({ content: "🔒 Locked.", ephemeral: true });
        }

        // END
        if (sub === "end") {
            if (!activeEvent)
                return interaction.reply({ content: "❌ No event.", ephemeral: true });

            const log = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);

            const embed = new EmbedBuilder()
                .setTitle("EVENT LOG")
                .addFields(
                    { name: "Host", value: activeEvent.host, inline: true },
                    { name: "Cohost", value: activeEvent.cohost, inline: true },
                    { name: "Event Name", value: activeEvent.name },
                    { name: "Attendees", value: `${interaction.options.getInteger("attendees")}`, inline: true },
                    { name: "Passers", value: interaction.options.getString("passers") },
                    { name: "Failed", value: `${interaction.options.getInteger("failed")}`, inline: true }
                )
                .setImage(interaction.options.getAttachment("proof").url)
                .setTimestamp();

            await log.send({ embeds: [embed] });

            activeEvent = null;

            return interaction.reply({
                content: "📁 Event logged.",
                ephemeral: true
            });
        }
    }
});

client.login(TOKEN);
