// script.js

const transcribeBtn = document.getElementById("transcribeBtn");
const audioFileInput = document.getElementById("audioFile");
const resultArea = document.getElementById("resultArea");

const API_KEY = "98d7ce4d19f8495daef43d57d3c87507";

transcribeBtn.addEventListener("click", async () => {
  const file = audioFileInput.files[0];

  if (!file) {
    resultArea.textContent = "Silakan pilih file audio terlebih dahulu.";
    return;
  }

  resultArea.textContent = "Sedang mengunggah audio...";

  try {
    // Step 1: Upload file ke AssemblyAI
    const uploadResponse = await fetch("https://api.assemblyai.com/v2/upload", {
      method: "POST",
      headers: {
        "Authorization": API_KEY
      },
      body: file
    });

    if (!uploadResponse.ok) {
      throw new Error("Gagal mengunggah file audio.");
    }

    const uploadData = await uploadResponse.json();
    const audioUrl = uploadData.upload_url;

    resultArea.textContent = "File terupload. Sedang memproses transkripsi...";

    // Step 2: Submit untuk transkripsi
    const transcriptResponse = await fetch("https://api.assemblyai.com/v2/transcript", {
      method: "POST",
      headers: {
        "Authorization": API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        language_code: "id" // Bahasa Indonesia
      })
    });

    if (!transcriptResponse.ok) {
      throw new Error("Gagal memulai transkripsi.");
    }

    const transcriptData = await transcriptResponse.json();
    const transcriptId = transcriptData.id;

    // Step 3: Polling untuk mendapatkan hasil
    resultArea.textContent = "Menunggu hasil transkripsi...";
    
    let transcript = null;
    while (true) {
      const pollingResponse = await fetch(
        `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
        {
          headers: {
            "Authorization": API_KEY
          }
        }
      );

      transcript = await pollingResponse.json();

      if (transcript.status === "completed") {
        resultArea.textContent = transcript.text || "Tidak ada hasil transkripsi ditemukan.";
        break;
      } else if (transcript.status === "error") {
        throw new Error("Transkripsi gagal: " + transcript.error);
      }

      // Tunggu 3 detik sebelum polling lagi
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

  } catch (error) {
    resultArea.textContent = "Terjadi kesalahan: " + error.message;
    console.error("Error detail:", error);
  }
});