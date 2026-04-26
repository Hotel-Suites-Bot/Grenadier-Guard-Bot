const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  REST,
  Routes
} = require('discord.js');

const axios = require('axios');

// ================= CONFIG =================
const TOKEN = process.env.TOKEN;
const CLIENT_ID = "1497828161235456040";
const GUILD_ID = "1486075194979127496";

// BGC
const REQUIRED_ROLE_ID = "1486075194979127499";
const BLACKLISTED_GROUPS = [32366337];
const MAIN_GROUP_ID = 35365203;

// EVENT SYSTEM
const EVENT_STAFF_ROLE = "1486075194979127499";
const EVENT_PING_ROLE = "1486075194979127503";
const EVENT_POST_CHANNEL = "1486075196178956402";
const EVENT_LOG_CHANNEL = "1486075197143519429";
const ROBLOX_GAME_LINK = "https://www.roblox.com/games/3295514368/British-Army";
// ==========================================

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// store active events
const activeEvents = new Map();

// ================= COMMANDS =================
const commands = [
  new SlashCommandBuilder()
    .setName("bgc")
    .setDescription("Run a Roblox background check")
    .addStringOption(option =>
      option.setName("username").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("event")
    .setDescription("Event system")
    .addSubcommand(sub =>
      sub.setName("host")
        .addUserOption(o => o.setName("host").setRequired(true))
        .addUserOption(o => o.setName("cohost"))
        .addStringOption(o => o.setName("name").setRequired(true))
        .addStringOption(o =>
          o.setName("type")
            .setRequired(true)
            .addChoices(
              { name: "Tryout", value: "Tryout" },
              { name: "Training", value: "Training" }
            )
        )
    )
    .addSubcommand(sub => sub.setName("start"))
    .addSubcommand(sub =>
      sub.setName("end")
        .addUserOption(o => o.setName("host").setRequired(true))
        .addUserOption(o => o.setName("cohost"))
        .addStringOption(o => o.setName("name").setRequired(true))
        .addIntegerOption(o => o.setName("attendees").setRequired(true))
        .addIntegerOption(o => o.setName("passed").setRequired(true))
        .addIntegerOption(o => o.setName("failed").setRequired(true))
        .addAttachmentOption(o => o.setName("proof").setRequired(true))
    )
];

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );
})();

// ================= READY =================
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // ================= BGC =================
  if (interaction.commandName === "bgc") {

    if (!interaction.member.roles.cache.has(REQUIRED_ROLE_ID)) {
      return interaction.reply({ content: "❌ No permission.", ephemeral: true });
    }

    const username = interaction.options.getString("username");
    await interaction.deferReply();

    try {
      const userRes = await axios.post("https://users.roblox.com/v1/usernames/users", {
        usernames: [username]
      });

      const user = userRes.data.data[0];
      if (!user) return interaction.editReply("User not found.");

      const userId = user.id;

      const userInfo = await axios.get(`https://users.roblox.com/v1/users/${userId}`);
      const created = new Date(userInfo.data.created);
      const ageDays = Math.floor((Date.now() - created) / 86400000);

      const groupsRes = await axios.get(`https://groups.roblox.com/v2/users/${userId}/groups/roles`);
      const groups = groupsRes.data.data;

      let redFlag = false;
      let flaggedGroup = null;

      for (let g of groups) {
        if (BLACKLISTED_GROUPS.includes(g.group.id)) {
          redFlag = true;
          flaggedGroup = g.group.name;
          break;
        }
      }

      let status = redFlag
        ? `🔴 RED FLAG\nBlacklisted Group: ${flaggedGroup}`
        : ageDays < 60
        ? `🟠 ORANGE FLAG\nAccount under 60 days`
        : `🟢 GREEN FLAG\nAll clear`;

      const embed = new EmbedBuilder()
        .setTitle("🪖 BACKGROUND CHECK")
        .setColor(redFlag ? 0xff0000 : 0x00ff00)
        .addFields(
          { name: "User", value: username, inline: true },
          { name: "Account Age", value: `${ageDays} days`, inline: true },
          { name: "Status", value: status }
        );

      interaction.editReply({ embeds: [embed] });

    } catch {
      interaction.editReply("Error fetching data.");
    }
  }

  // ================= EVENT SYSTEM =================
  if (interaction.commandName === "event") {

    if (!interaction.member.roles.cache.has(EVENT_STAFF_ROLE)) {
      return interaction.reply({ content: "❌ No permission.", ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();

    // ===== HOST =====
    if (sub === "host") {

      const host = interaction.options.getUser("host");
      const cohost = interaction.options.getUser("cohost");
      const name = interaction.options.getString("name");
      const type = interaction.options.getString("type");

      const embed = new EmbedBuilder()
        .setTitle("🪖 EVENT")
        .setColor(0x2b2d31)
        .setDescription(`**${name}**`)
        .addFields(
          { name: "HOST(s)", value: `Host: <@${host.id}>\nCo-Host: ${cohost ? `<@${cohost.id}>` : "None"}` },
          { name: "TYPE", value: type, inline: true },
          { name: "STATUS", value: "🟢 OPEN", inline: true }
        )
        .setFooter({ text: "British Army Event Panel" });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Join Operation")
          .setStyle(ButtonStyle.Link)
          .setURL(ROBLOX_GAME_LINK)
      );

      const postChannel = interaction.client.channels.cache.get(EVENT_POST_CHANNEL);
      if (!postChannel) {
        return interaction.reply({ content: "❌ Event post channel not found.", ephemeral: true });
      }

      const msg = await postChannel.send({
        content: `<@&${EVENT_PING_ROLE}>`,
        embeds: [embed],
        components: [row]
      });

      activeEvents.set(interaction.guild.id, msg.id);

      interaction.reply({ content: "✅ Event posted.", ephemeral: true });
    }

    // ===== START =====
    if (sub === "start") {

      const msgId = activeEvents.get(interaction.guild.id);
      if (!msgId) {
        return interaction.reply({ content: "❌ No active event.", ephemeral: true });
      }

      const postChannel = interaction.client.channels.cache.get(EVENT_POST_CHANNEL);
      const msg = await postChannel.messages.fetch(msgId);

      const embed = EmbedBuilder.from(msg.embeds[0]);
      embed.spliceFields(2, 1, { name: "STATUS", value: "🔴 LOCKED", inline: true });

      await msg.edit({ embeds: [embed] });

      interaction.reply({ content: "🔒 Event locked.", ephemeral: true });
    }

    // ===== END =====
    if (sub === "end") {

      const proof = interaction.options.getAttachment("proof");

      const embed = new EmbedBuilder()
        .setTitle("📊 EVENT COMPLETE")
        .setColor(0xff0000)
        .addFields(
          { name: "Attendees", value: `${interaction.options.getInteger("attendees")}`, inline: true },
          { name: "Passed", value: `${interaction.options.getInteger("passed")}`, inline: true },
          { name: "Failed", value: `${interaction.options.getInteger("failed")}`, inline: true }
        )
        .setImage(proof.url)
        .setFooter({ text: "British Army Event Logs" });

      const logChannel = interaction.client.channels.cache.get(EVENT_LOG_CHANNEL);
      if (logChannel) {
        logChannel.send({ embeds: [embed] });
      }

      activeEvents.delete(interaction.guild.id);

      interaction.reply({ content: "📁 Event logged.", ephemeral: true });
    }
  }
});

client.login(TOKEN);
