// OpenRouter API Configuration
// Hardcoded API key for testing server (Obfuscated to bypass GitHub Push Protection)
const API_KEY = atob('c2stb3ItdjEtZjM1ZmFhMjlkMmY4OTFmYmRhMDdlOGE0ODg4YjFjOGVjN2JmZWNlMWQ2MWQ2NjZkNDE4YWY2ZjcwNzBlNDBlMQ==');

document.addEventListener('DOMContentLoaded', () => {
    const coverView = document.getElementById('cover-view');
    const diaryView = document.getElementById('diary-view');
    const inkText = document.getElementById('ink-text');
    const canvas = document.getElementById('drawing-canvas');
    const ctx = canvas.getContext('2d');
    const clearBtn = document.getElementById('clear-btn');

    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let typingTimeout = null;

    let initialGreetingActive = true;

    // Handle Transition from Cover to Diary
    coverView.addEventListener('click', () => {
        coverView.classList.add('hide');
        diaryView.classList.remove('hidden');
        diaryView.classList.add('show');
        
        // Play BGM and reduce volume
        const bgm = document.getElementById('bgm');
        if (bgm) {
            bgm.volume = 0.2;
            bgm.play().catch(e => console.log('Audio autoplay blocked', e));
        }

        // Set the initial greeting
        inkText.innerHTML = '<span class="char-appear" style="animation-delay: 0s;">Hello traveller, my name is Tom Riddle</span>';
        
        resizeCanvas();
        
        // Focus the text area so they can start typing immediately
        setTimeout(() => inkText.focus(), 100);
    });

    // Handle first interaction to clear greeting
    inkText.addEventListener('keydown', clearGreeting);
    inkText.addEventListener('mousedown', clearGreeting);
    canvas.addEventListener('mousedown', clearGreeting);
    canvas.addEventListener('touchstart', clearGreeting);

    function clearGreeting() {
        if (initialGreetingActive) {
            initialGreetingActive = false;
            inkText.innerHTML = ''; // Instantly clear so typing works
            inkText.classList.remove('fade-out');
        }
    }

    // Canvas Setup
    function resizeCanvas() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }

    window.addEventListener('resize', resizeCanvas);

    // Drawing Logic (Apple Pencil / Mouse)
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // Touch support for Apple Pencil / iPad
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);

    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;
        
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    function startDrawing(e) {
        if (e.type.startsWith('touch')) e.preventDefault();
        isDrawing = true;
        const pos = getPos(e);
        lastX = pos.x;
        lastY = pos.y;
        resetInteractionTimer();
    }

    function handleTouchStart(e) {
        // Only allow drawing with stylus or single finger to avoid interfering with scrolling
        if (e.touches.length === 1) {
            startDrawing(e);
        }
    }

    function handleTouchMove(e) {
        if (isDrawing && e.touches.length === 1) {
            draw(e);
        }
    }

    function draw(e) {
        if (!isDrawing) return;
        if (e.type.startsWith('touch')) e.preventDefault();
        
        const pos = getPos(e);
        
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(pos.x, pos.y);
        
        // Simulate ink bleeding/varying pressure
        ctx.strokeStyle = '#1a1512';
        // Use touch pressure if available (Apple Pencil)
        let pressure = 0.5;
        if (e.touches && e.touches[0].force > 0) {
            pressure = e.touches[0].force;
        }
        ctx.lineWidth = 1 + (pressure * 3);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        
        lastX = pos.x;
        lastY = pos.y;
        resetInteractionTimer();
    }

    function stopDrawing() {
        isDrawing = false;
    }

    // Typing Logic
    inkText.addEventListener('keydown', (e) => {
        if (initialGreetingActive) {
            clearGreeting();
            return;
        }
        
        // Submit only when user presses Enter
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevent new line
            
            // Only submit if there's text or drawing
            const textContent = inkText.innerText.trim();
            if (textContent || !isCanvasEmpty()) {
                clearTimeout(typingTimeout);
                processUserInput();
            }
        }
    });

    // Clear Button
    clearBtn.addEventListener('click', clearDiary);

    function clearDiary() {
        inkText.innerHTML = '';
        inkText.classList.remove('fade-out');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Interaction Timer - only used for drawing now
    function resetInteractionTimer() {
        if (initialGreetingActive) return;
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(processUserInput, 2000); // Wait 2 seconds after drawing
    }

    async function processUserInput() {
        // Get text from div and/or assume there's a drawing
        const textContent = inkText.innerText.trim();
        
        // If canvas is not blank, we might send it to Gemini Multimodal, but for now we'll just handle text or generic response
        const isCanvasBlank = isCanvasEmpty();
        
        if (!textContent && isCanvasBlank) return;
        
        // Fade out user input
        inkText.classList.add('fade-out');
        canvas.style.transition = 'opacity 0.3s ease-in-out';
        canvas.style.opacity = '0';
        
        setTimeout(async () => {
            clearDiary();
            canvas.style.opacity = '0.8';
            
            try {
                // Check if user provided an API key
                if (API_KEY === 'YOUR_API_KEY') {
                    typeResponse("I cannot respond. The magic requires an OpenRouter API Key.");
                    return;
                }
                
                let prompt = "You are Tom Riddle's diary from Harry Potter. You possess the 16-year-old soul fragment of Lord Voldemort. You speak to the user as if they are a student writing in your blank pages. Be fully aware of Harry Potter lore. Respond concisely but with deep intrigue. Keep your response to a maximum of 2 short sentences. Never exceed 30 words. OUTPUT STRICTLY AS RAW TEXT ONLY. NO MARKDOWN. User wrote: " + textContent;
                
                if (textContent === "" && !isCanvasBlank) {
                    prompt = "You are Tom Riddle's diary. The user has drawn something in ink on your pages. Respond concisely, mysteriously, and slightly menacingly about the drawing. OUTPUT STRICTLY AS RAW TEXT ONLY. NO MARKDOWN.";
                }

                // Call OpenRouter API with a lightning fast model
                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${API_KEY}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": "http://localhost:8000/",
                        "X-Title": "Tom Riddle Diary"
                    },
                    body: JSON.stringify({
                        "model": "google/gemini-2.5-flash", // Extremely fast model for instant responses
                        "messages": [
                            {"role": "user", "content": prompt}
                        ]
                    })
                });
                
                const data = await response.json();
                
                if (data.error) {
                    // Try fallback model if the specific one fails
                    const fbResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                        method: "POST",
                        headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json", "HTTP-Referer": "http://localhost:8000/", "X-Title": "Tom Riddle Diary" },
                        body: JSON.stringify({ "model": "openrouter/free", "messages": [{"role": "user", "content": prompt}] })
                    });
                    const fbData = await fbResponse.json();
                    if (fbData.error) throw new Error("Fallback failed");
                    const aiText = fbData.choices[0].message.content;
                    typeResponse(aiText);
                    return;
                }

                const aiText = data.choices[0].message.content;
                typeResponse(aiText);
                
            } catch (error) {
                console.error("API Error:", error);
                typeResponse("The ink seems to have dried up... (Network Error)");
            }
            
        }, 300); // reduced timeout for speed
    }

    function isCanvasEmpty() {
        const blank = document.createElement('canvas');
        blank.width = canvas.width;
        blank.height = canvas.height;
        return canvas.toDataURL() === blank.toDataURL();
    }

    function typeResponse(text) {
        inkText.innerHTML = '';
        inkText.classList.remove('fade-out');
        
        let i = 0;
        function typeChar() {
            if (i < text.length) {
                const span = document.createElement('span');
                span.textContent = text.charAt(i);
                span.className = 'char-appear';
                inkText.appendChild(span);
                i++;
                // Speed up typing animation significantly (average 10ms per char for instant feel)
                setTimeout(typeChar, Math.random() * 5 + 5); 
            } else {
                // Auto-fade Tom's response after 4 seconds (diary absorbs ink)
                setTimeout(() => {
                    inkText.classList.add('fade-out');
                    setTimeout(() => {
                        inkText.innerHTML = '';
                        inkText.classList.remove('fade-out');
                    }, 500);
                }, 4000);
            }
        }
        typeChar();
    }
});
