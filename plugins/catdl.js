const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { cmd } = require("../command");

cmd({
  'pattern': "catdl",
  'alias': ["catboxdl", "vvdl", "downloadcat"],
  'react': '⬇️',
  'desc': "Download files from Catbox.moe",
  'category': "utility",
  'use': "<catbox_url>",
  'filename': __filename
}, async (client, message, args, { reply }) => {
  try {
    // Check if URL is provided
    const catboxUrl = args[0];
    if (!catboxUrl || !catboxUrl.includes("catbox.moe")) {
      return await reply("Please provide a valid Catbox URL\nExample: .catdl https://files.catbox.moe/abc123.jpg");
    }

    // Extract filename from URL
    const urlParts = catboxUrl.split("/");
    let filename = urlParts[urlParts.length - 1];
    
    // Add extension if missing (some catbox URLs don't have extensions)
    if (!filename.includes(".")) {
      // Try to determine content type first
      try {
        const headResponse = await axios.head(catboxUrl);
        const contentType = headResponse.headers["content-type"];
        if (contentType.includes("image/jpeg")) filename += ".jpg";
        else if (contentType.includes("image/png")) filename += ".png";
        else if (contentType.includes("video")) filename += ".mp4";
        else if (contentType.includes("audio")) filename += ".mp3";
      } catch {
        // Default to .mp4 if we can't determine
        filename += ".mp4";
      }
    }

    // Download the file
    await reply("⬇️ Downloading file from Catbox...");
    const response = await axios({
      method: "GET",
      url: catboxUrl,
      responseType: "stream"
    });

    const tempPath = path.join(__dirname, "../temp", filename);
    const writer = fs.createWriteStream(tempPath);
    
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    // Send the file back
    await reply("✅ Download complete!");
    await client.sendMessage(message.from, {
      file: tempPath,
      mimetype: response.headers["content-type"]
    }, { quoted: message });

    // Clean up
    fs.unlinkSync(tempPath);

  } catch (error) {
    console.error(error);
    await reply(`Error: ${error.message || "Failed to download file"}`);
  }
});
