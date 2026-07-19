const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');

// ⚙️ AYARLAR
const BOT_TOKEN = "ut6Dxj8vnIM_6NJTfebYiWPqyde2hOZh"; // Discord Developer Portal'dan aldığın bot tokeni
const CHANNEL_ID = "1528161806084739122";   // Eşyaların loglanacağı Discord Kanal ID'si
const CHECK_INTERVAL = 60000;          // Kaç milisaniyede bir kontrol etsin? (60000 ms = 1 Dakika)

// Discord Client kurulumu
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

// Rolimons'tan çekilen eski eşyaları hafızada tutacağımız yer (Cache)
let knownItemsCache = new Set();
let isFirstRun = true;

// 🌐 Rolimons API'sinden veri çeken ve karşılaştıran fonksiyon
async function checkRolimonsItems() {
    try {
        console.log("[Rolimons] API kontrol ediliyor...");
        
        // Cloudflare engeline takılmamak için gerçek tarayıcı süsü (User-Agent) veriyoruz
        const response = await axios.get('https://www.rolimons.com/itemapi/itemdetails', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.data || !response.data.success) {
            console.error("[Hata] Rolimons API'sinden başarısız yanıt döndü.");
            return;
        }

        const items = response.data.items;
        const channel = await client.channels.fetch(CHANNEL_ID);
        
        if (!channel) {
            console.error("[Hata] Belirtilen Discord kanalı bulunamadı!");
            return;
        }

        // API'deki tüm Item ID'lerini tek tek dönüyoruz
        for (const itemId in items) {
            // Rolimons veri yapısı array şeklindedir:
            // itemData[0] = Eşya Adı, itemData[2] = RAP/Value, itemData[3] = En Ucuz Fiyat (Best Price)
            const itemData = items[itemId];
            const itemName = itemData[0];
            const itemValue = itemData[2] || "Bilinmiyor";
            const bestPrice = itemData[3] || "Satışta Değil";

            // EĞER BU ID HAFIZAMIZDA YOKSA (YENİ DÜŞMÜŞSE)
            if (!knownItemsCache.has(itemId)) {
                
                // Bot ilk açıldığında piyasadaki binlerce eski eşyayı tek tek kanala spamlamasın diye bu önlemi alıyoruz
                if (!isFirstRun) {
                    console.log(`[YENİ EŞYA] ${itemName} (ID: ${itemId}) bulundu! Discord'a gönderiliyor...`);

                    // Discord Embed Mesaj Tasarımı
                    const embed = new EmbedBuilder()
                        .setTitle("🚨 ROLIMONS'A YENİ SİSTEM DÜŞTÜ! 🚨")
                        .setDescription(`**[${itemName}](https://www.roblox.com/catalog/${itemId})** isimli eşya Rolimons listelerine eklendi.`)
                        .setColor('#0099ff')
                        .addFields(
                            { name: '📦 Eşya Adı', value: itemName, inline: true },
                            { name: '🆔 Asset ID', value: itemId, inline: true },
                            { name: '📊 Değer (RAP)', value: String(itemValue), inline: true },
                            { name: '💰 En Ucuz Fiyat', value: `${bestPrice} R$`, inline: true }
                        )
                        .setThumbnail(`https://www.roblox.com/asset-thumbnail/image?assetId=${itemId}&width=150&height=150&format=png`)
                        .setTimestamp()
                        .setFooter({ text: 'Rolimons Canlı Takip Sistemi' });

                    // Kanala mesaj fırlat
                    await channel.send({ embeds: [embed] });
                }

                // Yeni bulunan eşyayı hafızaya ekle ki bir daha loglamasın
                knownItemsCache.add(itemId);
            }
        }

        // İlk tarama bitti, artık yeni düşecek olanları yakalayabiliriz
        if (isFirstRun) {
            console.log(`[Başarılı] İlk tarama tamamlandı. Toplam ${knownItemsCache.size} eşya hafızaya alındı. İzleme aktif!`);
            isFirstRun = false;
        }

    } catch (error) {
        console.error("[Hata] Veri çekilirken veya işlenirken bir sorun oluştu:", error.message);
    }
}

// Bot hazır olduğunda çalışacak kısım
client.once('ready', () => {
    console.log(`[Bot Aktif] ${client.user.tag} olarak giriş yapıldı!`);
    
    // Bot açılır açılmaz ilk kontrolü yap
    checkRolimonsItems();
    
    // Belirlediğin periyotta (Örn: 60 saniyede bir) bu fonksiyonu sürekli tetikle
    setInterval(checkRolimonsItems, CHECK_INTERVAL);
});

// Botu çalıştır
client.login(BOT_TOKEN);
