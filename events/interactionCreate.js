const { Collection, EmbedBuilder, codeBlock } = require("discord.js");
const Discord = require("discord.js")
const wixua = require("croxydb");
const wixuadb = require("orio.db")
const { readdirSync } = require("fs");
module.exports = async(client, interaction) => {

  if (!interaction.guild) return;
  
  const { user, customId, guild } = interaction;
  
  if(interaction.isButton()) {
    if(interaction.customId === `reddet_${interaction.user.id}`) {
      return interaction.update({ content: "`✅` **|** Destek sistemi kurulumu iptal edildi.", embeds: [], components: [] })
    }
    
    if(interaction.customId === `onayla_${interaction.user.id}`) {
      interaction.update({ content: "`✅` **|** Destek sistemi kurulumu başarılı.", embeds: [], components: [] });
      
      const ticketac = new Discord.EmbedBuilder()
      .setAuthor({ name: `${guild.name} | Ticket sistemi`, iconURL: `${guild.iconURL({ dynmaic: true })}` })
      .setThumbnail(guild.iconURL({ dynmaic: true }))
      .setDescription(`\`-\` Selam destek talebi açmak için aşşağıdaki butona basınız.\n\n**Unutma:** Gereksiz dışı destek açman senin ceza almana sebep olabilir.`)
      .setFooter({ text: `Kurulumu yapan: ${user.tag}`, iconURL: `${user.displayAvatarURL({ dynmaic: true })}` })
      .setTimestamp()
      
      const ticketacbuton = new Discord.ActionRowBuilder()
			.addComponents(
				new Discord.ButtonBuilder()
					.setCustomId(`ticketAc_${guild.id}`)
					.setLabel('Destek talebi oluştur.')
          .setEmoji("🍁")
					.setStyle(Discord.ButtonStyle.Secondary)
			);
      
      const category = await guild.channels.create({
        name: 'Ticket Log',
        type: Discord.ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [Discord.PermissionsBitField.Flags.ViewChannel],
          },
        ],
      });
      
      const ticketLog = await guild.channels.create({
        name: 'ticket-log',
        type: Discord.ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [Discord.PermissionsBitField.Flags.ViewChannel],
          },
        ],
      });
      
      wixua.set(`ticketKatagor_${guild.id}`, { category:  category.id, log: ticketLog.id });
      wixua.set(`ticketSistem_${guild.id}`, { isOpen: true });
      
      return interaction.channel.send({ embeds: [ticketac], components: [ticketacbuton] })
    }
  }

  if(interaction.customId === `ticketAc_${interaction.guild.id}`) {
      
    const ticketKatagor = wixua.fetch(`ticketKatagor_${guild.id}`);
    const ticketSistem = wixua.fetch(`ticketSistem_${guild.id}`);
    const ticketKullanıcı = wixuadb.fetch(`ticketKullanıcı_${user.id}${guild.id}`);
    
    if(!ticketSistem) return;
    if(!ticketKatagor) return;
    
    if(ticketKullanıcı) {
      const channelURL = `https://discord.com/channels/${ticketKullanıcı.guildId}/${ticketKullanıcı.channelId} `
      return interaction.reply({ content: `✅ **|** Zaten bir tane [destek kanalı](${channelURL}) oluşturmuşssun.`, ephemeral: true })
    }
    
    const channel = await guild.channels.create({
      name: `ticket-${user.tag}`,
      type: Discord.ChannelType.GuildText,
      parent: ticketKatagor.category,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [Discord.PermissionsBitField.Flags.ViewChannel],
        },
         {
          id: user.id,
          allow: [Discord.PermissionsBitField.Flags.ViewChannel, Discord.PermissionsBitField.Flags.SendMessages],
        },
      ],
    });

    wixuadb.set(`ticketKullanıcı_${user.id}${guild.id}`, { isTicketAc: true, channelId: channel.id, guildId: guild.id, date: Date.now() });
    wixuadb.set(`ticketKanalKullanıcı_${channel.id}${guild.id}`, { userId: user.id, channelId: channel.id, guildId: guild.id });
    
    const channelURL = `https://discord.com/channels/${guild.id}/${channel.id} `
    
    const ticketUserEmbed = new Discord.EmbedBuilder()
    .setAuthor({ name: `${user.username} | Destek açıldı`, iconURL: `${user.displayAvatarURL({ dynmaic: true })} ` })
    .setThumbnail(guild.iconURL({ dynmaic: true }))
    .addFields([
      {
        name: "Destek açan:",
        value: `${interaction.user}`,
        inline: true
      },
      {
        name: "Açılış zamanı:",
        value: `<t:${parseInt(channel.createdTimestamp / 1000)}:R>`,
        inline: true
      }
    ])
    .setFooter({ text: `Oluşturan: ${client.user.tag}`, iconURL: `${client.user.displayAvatarURL({ dynmaic: true })}` })
    .setTimestamp()
    
    const row = new Discord.ActionRowBuilder()
    .addComponents(
      new Discord.ButtonBuilder()
        .setCustomId(`ticketKapat_${guild.id}${channel.id}`)
        .setLabel('Destek kapatılsın.')
        .setEmoji("❌")
        .setStyle(Discord.ButtonStyle.Secondary),
    );
    
    interaction.reply({ content: `✅ |** Senin için bir tane [destek kanalı](${channelURL}) oluşturuldu.**`, ephemeral: true })
    const chnlMessage = await channel.send({content: "Yetkililer en kısa zamanda sizinle ilgilenecektir.", embeds: [ticketUserEmbed], components: [row] })
    
    return chnlMessage.pin()
  }

  if(customId === `ticketKapat_${guild.id}${interaction.channel.id}`) {
      
    const ticketKullanıcı = wixuadb.fetch(`ticketKanalKullanıcı_${interaction.channel.id}${guild.id}`);
    if(!ticketKullanıcı) {
        return interaction.channel.delete();
    }

    if(ticketKullanıcı) {
      member = await client.users.cache.get(ticketKullanıcı.userId);
      
      const channel = await client.channels.cache.get(wixua.fetch(`ticketKatagor_${guild.id}`).log)
    
    const ticketUserClose = new Discord.EmbedBuilder()
    .setAuthor({ name: `${client.user.username} | Ticket Log`, iconURL: `${client.user.displayAvatarURL({ dynmaic: true })} ` })
    .setDescription(`${member.tag} tarafından açılan destek <t:${parseInt(Date.now() / 1000)}:R> sonlandırıldı`)
    .setThumbnail(user.displayAvatarURL({ dynmaic: true }))
    .addFields([
      {
        name: "Açılış tarihi:",
        value: `<t:${parseInt((ticketKullanıcı.date ?? Date.now()) / 1000)}:R>`,
        inline: true
      },
      {
        name: "Açan kişi:",
        value: `${codeBlock("yaml", member.tag)}`,
        inline: true
      },
      { name: '\u200B', value: '\u200B' },
      {
        name: "Kapanış tarihi:",
        value: `<t:${parseInt(Date.now() / 1000)}:R>`,
        inline: true
      },
      {
        name: "Kapatan kişi:",
        value: `${codeBlock("yaml", user.tag)}`,
        inline: true
      }
    ])
    
    channel.send({ embeds: [ticketUserClose] })
      
     wixuadb.delete(`ticketKullanıcı_${ticketKullanıcı.userId}${guild.id}`)
     wixuadb.delete(`ticketKanalKullanıcı_${interaction.channel.id}${guild.id}`); 
      
      return interaction.channel.delete();
    }
    
    
  }

  if(interaction.isChatInputCommand()) {
    if (!interaction.guildId) return;
    readdirSync('./commands').forEach(f => {
      const cmd = require(`../commands/${f}`);
      if(interaction.commandName.toLowerCase() === cmd.name.toLowerCase()) {
        return cmd.run(client, interaction, wixua);
      }
});
}
  }

