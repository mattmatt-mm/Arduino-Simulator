import { CODE_MODIFICATION_PROMPT, COMPONENT_EXTRACTION_PROMPT, URL_ANALYSIS_PROMPT } from '../constants/prompts';

const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent';

class GeminiService {
    getApiKey() {
        const key = localStorage.getItem('geminiApiKey');
        if (!key) {
            throw new Error('Please set your Gemini API key in Settings');
        }
        if (!key.startsWith('AIza')) {
            throw new Error('Invalid API key format. Gemini API keys should start with "AIza"');
        }
        return key;
    }

    async generateContent(prompt, inlineData = null) {
        const apiKey = this.getApiKey();
        const url = `${API_BASE_URL}?key=${apiKey}`;

        const parts = [{ text: prompt }];
        if (inlineData) {
            parts.push({ inline_data: inlineData });
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts }] })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API error (${response.status}): ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
            throw new Error('Invalid response from AI');
        }

        return data.candidates[0].content.parts[0].text;
    }

    cleanJson(text) {
        let jsonStr = text.trim();
        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/```\n?/g, '');
        }
        return jsonStr;
    }

    async modifyCode(currentCode, userPrompt) {
        const prompt = CODE_MODIFICATION_PROMPT
            .replace('{code}', currentCode)
            .replace('{prompt}', userPrompt);

        let modifiedCode = await this.generateContent(prompt);

        // Clean up markdown code blocks if present
        if (modifiedCode.includes('```')) {
            modifiedCode = modifiedCode
                .replace(/```cpp\n?/g, '')
                .replace(/```c\n?/g, '')
                .replace(/```arduino\n?/g, '')
                .replace(/```\n?/g, '');
        }

        return modifiedCode.trim();
    }

    async analyzeComponentFromPdf(base64Data) {
        const prompt = COMPONENT_EXTRACTION_PROMPT.replace('{sourceType}', 'datasheet/schematic PDF');
        const inlineData = {
            mime_type: 'application/pdf',
            data: base64Data
        };

        const response = await this.generateContent(prompt, inlineData);
        const jsonStr = this.cleanJson(response);
        return JSON.parse(jsonStr);
    }

    async analyzeComponentFromImage(base64Data, mimeType) {
        const prompt = COMPONENT_EXTRACTION_PROMPT.replace('{sourceType}', 'image');
        const inlineData = {
            mime_type: mimeType,
            data: base64Data
        };

        const response = await this.generateContent(prompt, inlineData);
        const jsonStr = this.cleanJson(response);
        return JSON.parse(jsonStr);
    }

    async analyzeComponentFromUrl(url) {
        // Fetch content (using proxy if needed, similar to original implementation)
        let pageContent = '';
        try {
            const pageResponse = await fetch(url);
            if (pageResponse.ok) {
                pageContent = await pageResponse.text();
            } else {
                throw new Error('Direct fetch failed');
            }
        } catch (e) {
            // Fallback to proxy
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
            const proxyResponse = await fetch(proxyUrl);
            if (!proxyResponse.ok) throw new Error('Failed to fetch webpage content');
            pageContent = await proxyResponse.text();
        }

        // Clean content
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = pageContent;
        const scripts = tempDiv.querySelectorAll('script, style, noscript');
        scripts.forEach(el => el.remove());
        const cleanedContent = (tempDiv.textContent || tempDiv.innerText || '').replace(/\s+/g, ' ').trim().substring(0, 30000);

        const prompt = URL_ANALYSIS_PROMPT
            .replace('{url}', url)
            .replace('{content}', cleanedContent);

        const response = await this.generateContent(prompt);
        const jsonStr = this.cleanJson(response);
        return JSON.parse(jsonStr);
    }
    async validateApiKey(apiKey) {
        if (!apiKey || !apiKey.startsWith('AIza')) {
            return false;
        }

        try {
            // Try a minimal generation request to validate the key
            const url = `${API_BASE_URL}?key=${apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: "Hi" }] }],
                    generationConfig: { maxOutputTokens: 1 }
                })
            });

            return response.ok;
        } catch (error) {
            console.error('API validation error:', error);
            return false;
        }
    }
}

export const geminiService = new GeminiService();
