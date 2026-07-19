const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');

// ⚙️ AYARLAR
const CHANNEL_ID = "1528161806084739122";
const CHECK_INTERVAL = 60000;

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

let knownItemsCache = new Set();
let isFirstRun = true;

async function checkRolimonsItems() {
    try {
        console.log("[Rolimons] API kontrol ediliyor...");
        const response = await axios.get('https://www.rolimons.com/itemapi/itemdetails', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        if (!response.data || !response.data.success) return;

        const items = response.data.items;
        const channel = await client.channels.fetch(CHANNEL_ID);
        if (!channel) return;

        for (const itemId in items) {
            const itemData = items[itemId];
            const itemName = itemData[0];
            const itemValue = itemData[2] || "Bilinmiyor";
            const bestPrice = itemData[3] || "Satışta Değil";

            if (!knownItemsCache.has(itemId)) {
                if (!isFirstRun) {
                    const embed = new EmbedBuilder()
                        .setTitle("🚨 ROLIMONS YENİ SİSTEM DÜŞTÜ! 🚨")
                        .setDescription(`**[${itemName}](https://www.roblox.com/catalog/${itemId})**`)
                        .addFields(
                            { name: '📦 Eşya Adı', value: itemName, inline: true },
                            { name: '📊 Değer (RAP)', value: String(itemValue), inline: true },
                            { name: '💰 Fiyat', value: `${bestPrice} R$`, inline: true }
                        );
                    await channel.send({ embeds: [embed] });
                }
                knownItemsCache.add(itemId);
            }
        }
        isFirstRun = false;
    } catch (error) {
        console.error("[Hata]", error.message);
    }
}

client.once('ready', () => {
    console.log(`[Bot Aktif] ${client.user.tag}`);
    checkRolimonsItems();
    setInterval(checkRolimonsItems, CHECK_INTERVAL);
});

// BURASI ÇOK ÖNEMLİ: Hatalı olan yer burasıydı, düzelttim:
client.login(process.env.BOT_TOKEN);
