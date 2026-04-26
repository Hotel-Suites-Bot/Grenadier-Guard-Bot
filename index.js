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
const TOKEN = process.env.TOKEN // set in Wispbyte env
const CLIENT_ID = "1497828161235456040";
const GUILD_ID = "1486075194979127496";

const REQUIRED_ROLE_ID = "1486075194979127499";

const BLACKLISTED_GROUPS = [32366337];
const MAIN_GROUP_ID = 35365203;
// ==========================================

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ================= REGISTER COMMAND =================
const commands = [
  new SlashCommandBuilder()
    .setName("bgc")
    .setDescription("Run a Roblox background check")
    .addStringOption(option =>
      option.setName("username")
        .setDescription("Roblox username")
        .setRequired(true)
    )
];

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("Registering slash command...");
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log("Slash command registered.");
  } catch (err) {
    console.error(err);
  }
})();

// ================= BOT READY =================
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// ================= COMMAND HANDLER =================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "bgc") {

    // ðŸ” ROLE CHECK
    if (!interaction.member.roles.cache.has(REQUIRED_ROLE_ID)) {
      return interaction.reply({
        content: "âŒ You do not have permission to use this.",
        ephemeral: true
      });
    }

    const username = interaction.options.getString("username");

    await interaction.deferReply();

    try {
      // USER ID
      const userRes = await axios.post("https://users.roblox.com/v1/usernames/users", {
        usernames: [username],
        excludeBannedUsers: false
      });

      const user = userRes.data.data[0];
      if (!user) return interaction.editReply("User not found.");

      const userId = user.id;

      // USER INFO
      const userInfo = await axios.get(`https://users.roblox.com/v1/users/${userId}`);
      const created = new Date(userInfo.data.created);
      const ageDays = Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24));

      // AVATAR
      const avatarRes = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png`);
      const avatar = avatarRes.data.data[0].imageUrl;

      // GROUPS
      const groupsRes = await axios.get(`https://groups.roblox.com/v2/users/${userId}/groups/roles`);
      const groups = groupsRes.data.data;

      // FRIENDS
      const friendsRes = await axios.get(`https://friends.roblox.com/v1/users/${userId}/friends/count`);
      const friendsCount = friendsRes.data.count;

      // BADGES
      const badgesRes = await axios.get(`https://badges.roblox.com/v1/users/${userId}/badges?limit=100`);
      const badgeCount = badgesRes.data.data.length;

      // ================= FLAGS =================
      let redFlag = false;
      let flaggedGroup = null;
      let flaggedGroupId = null;

      for (let g of groups) {
        if (BLACKLISTED_GROUPS.includes(g.group.id)) {
          redFlag = true;
          flaggedGroup = g.group.name;
          flaggedGroupId = g.group.id;
          break;
        }
      }

      let orangeFlags = [];

      if (ageDays < 60) orangeFlags.push("Account under 60 days");
      if (badgeCount < 10) orangeFlags.push("Low badge count");
      if (friendsCount < 10) orangeFlags.push("Low friend count");

      const inMainGroup = groups.some(g => g.group.id === MAIN_GROUP_ID);
      if (!inMainGroup) orangeFlags.push("Not in main group");

      let statusText = "";
      let color = 0x00ff00;

      if (redFlag) {
        statusText = `ðŸ”´ RED FLAG\nUser is in blacklisted group:\n**${flaggedGroup}**`;
        color = 0xff0000;
      } else if (orangeFlags.length > 0) {
        statusText = `ðŸŸ  ORANGE FLAG\n${orangeFlags.map(x => `â€¢ ${x}`).join("\n")}`;
        color = 0xffa500;
      } else {
        statusText = `ðŸŸ¢ GREEN FLAG\nUser is all clear`;
        color = 0x00ff00;
      }

      // ================= PAGINATION =================
      const pageSize = 8;
      const pages = [];

      for (let i = 0; i < groups.length; i += pageSize) {
        const chunk = groups.slice(i, i + pageSize);

        pages.push(
          chunk.map(g => `**${g.group.name}**\nâ†³ Rank: ${g.role.name}`).join("\n\n")
        );
      }

      let currentPage = 0;

// ==========================================

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ================= REGISTER COMMAND =================
const commands = [
  new SlashCommandBuilder()
    .setName("bgc")
    .setDescription("Run a Roblox background check")
    .addStringOption(option =>
      option.setName("username")
        .setDescription("Roblox username")
        .setRequired(true)
    )
];

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log("Slash command registered.");
  } catch (err) {
    console.error(err);
  }
})();

// ================= READY =================
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// ================= COMMAND =================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "bgc") {

    // 🔐 ROLE CHECK
    if (!interaction.member.roles.cache.has(REQUIRED_ROLE_ID)) {
      return interaction.reply({
        content: "❌ You do not have permission to use this.",
        ephemeral: true
      });
    }

    const username = interaction.options.getString("username");

    await interaction.deferReply();

    try {
      // USER ID
      const userRes = await axios.post("https://users.roblox.com/v1/usernames/users", {
        usernames: [username],
        excludeBannedUsers: false
      });

      const user = userRes.data.data[0];
      if (!user) return interaction.editReply("User not found.");

      const userId = user.id;

      // USER INFO
      const userInfo = await axios.get(`https://users.roblox.com/v1/users/${userId}`);
      const created = new Date(userInfo.data.created);
      const ageDays = Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24));

      // AVATAR
      const avatarRes = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png`);
      const avatar = avatarRes.data.data[0].imageUrl;

      // GROUPS
      const groupsRes = await axios.get(`https://groups.roblox.com/v2/users/${userId}/groups/roles`);
      const groups = groupsRes.data.data;

      // FRIENDS
      const friendsRes = await axios.get(`https://friends.roblox.com/v1/users/${userId}/friends/count`);
      const friendsCount = friendsRes.data.count;

      // BADGES
      const badgesRes = await axios.get(`https://badges.roblox.com/v1/users/${userId}/badges?limit=100`);
      const badgeCount = badgesRes.data.data.length;

      // ================= FLAGS =================
      let redFlag = false;
      let flaggedGroup = null;
      let flaggedGroupId = null;

      for (let g of groups) {
        if (BLACKLISTED_GROUPS.includes(g.group.id)) {
          redFlag = true;
          flaggedGroup = g.group.name;
          flaggedGroupId = g.group.id;
          break;
        }
      }

      let orangeFlags = [];

      if (ageDays < 60) orangeFlags.push("Account under 60 days");
      if (badgeCount < 10) orangeFlags.push("Low badge count");
      if (friendsCount < 10) orangeFlags.push("Low friend count");

      const inMainGroup = groups.some(g => g.group.id === MAIN_GROUP_ID);
      if (!inMainGroup) orangeFlags.push("Not in main group");

      let statusText = "";
      let color = 0x00ff00;

      if (redFlag) {
        statusText = `🔴 RED FLAG
User is in blacklisted group:
${flaggedGroup}`;
        color = 0xff0000;
      } else if (orangeFlags.length > 0) {
        statusText = `🟠 ORANGE FLAG
${orangeFlags.map(x => `- ${x}`).join("\n")}`;
        color = 0xffa500;
      } else {
        statusText = `🟢 GREEN FLAG
User is all clear`;
        color = 0x00ff00;
      }

      // ================= PAGINATION =================
      const pageSize = 8;
      const pages = [];

      for (let i = 0; i < groups.length; i += pageSize) {
        const chunk = groups.slice(i, i + pageSize);

        pages.push(
          chunk.map(g => `${g.group.name}\nRank: ${g.role.name}`).join("\n\n")
        );
      }

      let currentPage = 0;

      const generateEmbed = (page) => {
        return new EmbedBuilder()
          .setTitle("🪖 Military Background Check")
          .setColor(color)
          .setThumbnail(avatar)
          .addFields(
            { name: "Username", value: username, inline: true },
            { name: "Account Age", value: `${ageDays} days`, inline: true },
            { name: "Friends", value: `${friendsCount}`, inline: true },
            { name: "Badges", value: `${badgeCount}`, inline: true },
            { name: "Status", value: statusText },
            { name: `Groups (${page + 1}/${pages.length})`, value: pages[page] || "None" }
          )
          .setFooter({ text: "British Army Verification System" })
          .setURL(`https://www.roblox.com/users/${userId}/profile`);
      };

      // ================= BUTTONS =================
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("prev")
          .setLabel("⬅️")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("next")
          .setLabel("➡️")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setLabel("View Profile")
          .setStyle(ButtonStyle.Link)
          .setURL(`https://www.roblox.com/users/${userId}/profile`)
      );

      if (redFlag) {
        row.addComponents(
          new ButtonBuilder()
            .setLabel("Flagged Group")
            .setStyle(ButtonStyle.Link)
            .setURL(`https://www.roblox.com/groups/${flaggedGroupId}`)
        );
      }

      const msg = await interaction.editReply({
        embeds: [generateEmbed(currentPage)],
        components: [row]
      });

      if (pages.length <= 1) return;

      const collector = msg.createMessageComponentCollector({
        time: 60000
      });

      collector.on("collect", async (i) => {
        if (i.user.id !== interaction.user.id) {
          return i.reply({ content: "Not your menu.", ephemeral: true });
        }

        if (i.customId === "next") {
          currentPage = (currentPage + 1) % pages.length;
        } else if (i.customId === "prev") {
          currentPage = (currentPage - 1 + pages.length) % pages.length;
        }

        await i.update({
          embeds: [generateEmbed(currentPage)]
        });
      });

      collector.on("end", () => {
        interaction.editReply({ components: [] });
      });

    } catch (err) {
      console.error(err);
      interaction.editReply("Error fetching Roblox data.");
    }
  }
});

client.login(TOKEN);
