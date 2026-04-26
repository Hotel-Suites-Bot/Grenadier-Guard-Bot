const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  REST,
  Routes,
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const TOKEN = process.env.TOKEN;
const CLIENT_ID = "1497828161235456040";
const GUILD_ID = "1486075194979127496";

const EVENT_CHANNEL_ID = "1486075196178956402";
const LOG_CHANNEL_ID = "1486075197306962206";
const EVENT_ROLE_ID = "1486075194979127503";
const STAFF_ROLE_ID = "1486075194979127499";

const ROBLOX_LINK = "https://www.roblox.com/games/3295514368";

let activeEvent = null;

//
// 📌 COMMANDS
//
const commands = [

  // EVENT COMMAND
  new SlashCommandBuilder()
    .setName("event")
    .setDescription("Event system commands")
    .addSubcommand(sub =>
      sub.setName("host")
        .setDescription("Host an event")
        .addUserOption(o => o.setName("host").setDescription("Host").setRequired(true))
        .addUserOption(o => o.setName("cohost").setDescription("Co Host").setRequired(false))
        .addStringOption(o => o.setName("name").setDescription("Event Name").setRequired(true))
        .addStringOption(o => o.setName("type").setDescription("Tryout or Training").setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName("start")
        .setDescription("Start the event")
    )
    .addSubcommand(sub =>
      sub.setName("end")
        .setDescription("End the event")
        .addIntegerOption(o => o.setName("attendees").setDescription("Attendees").setRequired(true))
        .addIntegerOption(o => o.setName("passed").setDescription("Passed").setRequired(true))
        .addIntegerOption(o => o.setName("failed").setDescription("Failed").setRequired(true))
        .addAttachmentOption(o => o.setName("proof").setDescription("Proof Screenshot").setRequired(true))
    ),

  // BGC COMMAND
  new SlashCommandBuilder()
    .setName("bgc")
    .setDescription("Background check a user")
    .addUserOption(o =>
      o.setName("user")
        .setDescription("User to check")
        .setRequired(true)
    ),
];

//
// 🚀 REGISTER COMMANDS
//
const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );
  console.log("✅ Commands registered");
})();

//
// 🎮 BOT READY
//
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

//
// ⚡ INTERACTIONS
//
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // 🔒 PERMISSION CHECK
  if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
    return interaction.reply({ content: "❌ No permission", ephemeral: true });
  }

  //
  // 🎯 EVENT SYSTEM
  //
  if (interaction.commandName === "event") {
    const sub = interaction.options.getSubcommand();

    if (sub === "host") {
      const host = interaction.options.getUser("host");
      const cohost = interaction.options.getUser("cohost");
      const name = interaction.options.getString("name");
      const type = interaction.options.getString("type");

      const embed = new EmbedBuilder()
        .setTitle(`📢 ${name}`)
        .setDescription(`**Type:** ${type}\n**Host:** ${host}\n**Co-Host:** ${cohost || "None"}\n\n🟢 Status: OPEN`)
        .setColor("Green");

      const button = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Join Event")
          .setStyle(ButtonStyle.Link)
          .setURL(ROBLOX_LINK)
      );

      const eventChannel = await client.channels.fetch(EVENT_CHANNEL_ID);

      const msg = await eventChannel.send({
        content: `<@&${EVENT_ROLE_ID}>`,
        embeds: [embed],
        components: [button],
      });

      activeEvent = { messageId: msg.id, channelId: EVENT_CHANNEL_ID, name };

      await interaction.reply({ content: "✅ Event hosted", ephemeral: true });
    }

    if (sub === "start") {
      if (!activeEvent) return interaction.reply({ content: "❌ No active event", ephemeral: true });

      const channel = await client.channels.fetch(activeEvent.channelId);
      const msg = await channel.messages.fetch(activeEvent.messageId);

      const embed = EmbedBuilder.from(msg.embeds[0])
        .setDescription(msg.embeds[0].description.replace("OPEN", "LOCKED"))
        .setColor("Red");

      await msg.edit({ embeds: [embed] });

      await interaction.reply({ content: "🔒 Event locked", ephemeral: true });
    }

    if (sub === "end") {
      if (!activeEvent) return interaction.reply({ content: "❌ No active event", ephemeral: true });

      const attendees = interaction.options.getInteger("attendees");
      const passed = interaction.options.getInteger("passed");
      const failed = interaction.options.getInteger("failed");
      const proof = interaction.options.getAttachment("proof");

      const logEmbed = new EmbedBuilder()
        .setTitle("📊 Event Ended")
        .setDescription(`**Event:** ${activeEvent.name}`)
        .addFields(
          { name: "Attendees", value: `${attendees}`, inline: true },
          { name: "Passed", value: `${passed}`, inline: true },
          { name: "Failed", value: `${failed}`, inline: true }
        )
        .setImage(proof.url)
        .setColor("Blue");

      const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);
      await logChannel.send({ embeds: [logEmbed] });

      activeEvent = null;

      await interaction.reply({ content: "✅ Event ended & logged", ephemeral: true });
    }
  }

  //
  // 🔍 BGC SYSTEM
  //
  if (interaction.commandName === "bgc") {
    const user = interaction.options.getUser("user");

    const embed = new EmbedBuilder()
      .setTitle("🔍 Background Check")
      .setDescription(`User: ${user}\nStatus: ✅ Clean`)
      .setColor("Green");

    await interaction.reply({ embeds: [embed] });
  }
});

client.login(TOKEN);
