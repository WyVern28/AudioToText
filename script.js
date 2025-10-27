const page1 = document.getElementById('page1');
    const page2 = document.getElementById('page2');
    const audioFileInput = document.getElementById('audioFile');
    const fileNameDisplay = document.getElementById('fileName');
    const transcribeBtn = document.getElementById('transcribeBtn');
    const backBtn = document.getElementById('backBtn');
    const resultBox = document.getElementById('resultBox');

    const API_KEY = "98d7ce4d19f8495daef43d57d3c87507";

    // Tampilkan nama file yang dipilih
    audioFileInput.addEventListener('change', () => {
      if (audioFileInput.files[0]) {
        fileNameDisplay.textContent = '✓ ' + audioFileInput.files[0].name;
      } else {
        fileNameDisplay.textContent = '';
      }
    });

    // Tombol Transkrip
    transcribeBtn.addEventListener('click', async () => {
      const file = audioFileInput.files[0];

      if (!file) {
        alert('Silakan pilih file audio terlebih dahulu.');
        return;
      }

      // Pindah ke halaman 2
      page1.classList.remove('active');
      page2.classList.add('active');
      resultBox.innerHTML = '<span class="loading">Sedang mengunggah audio</span>';

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

        resultBox.innerHTML = '<span class="loading">Memproses transkripsi</span>';

        // Step 2: Submit untuk transkripsi
        const transcriptResponse = await fetch("https://api.assemblyai.com/v2/transcript", {
          method: "POST",
          headers: {
            "Authorization": API_KEY,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            audio_url: audioUrl,
            language_code: "id"
          })
        });

        if (!transcriptResponse.ok) {
          throw new Error("Gagal memulai transkripsi.");
        }

        const transcriptData = await transcriptResponse.json();
        const transcriptId = transcriptData.id;

        // Step 3: Polling untuk mendapatkan hasil
        resultBox.innerHTML = '<span class="loading">Menunggu hasil transkripsi</span>';
        
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
            resultBox.textContent = transcript.text || "Tidak ada hasil transkripsi ditemukan.";
            break;
          } else if (transcript.status === "error") {
            throw new Error("Transkripsi gagal: " + transcript.error);
          }

          await new Promise(resolve => setTimeout(resolve, 3000));
        }

      } catch (error) {
        resultBox.innerHTML = '<span style="color: #f87171;">❌ Terjadi kesalahan: ' + error.message + '</span>';
        console.error("Error detail:", error);
      }
    });

    // Tombol Back
    backBtn.addEventListener('click', () => {
      page2.classList.remove('active');
      page1.classList.add('active');
      
      // Reset form
      audioFileInput.value = '';
      fileNameDisplay.textContent = '';
      resultBox.textContent = 'Menunggu hasil transkripsi...';
    });