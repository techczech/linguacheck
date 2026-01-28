# Contextual Verified Translate (LinguaCheck)

A high-precision, AI-powered translation tool designed for accuracy and nuance. Unlike standard translation services that often translate sentences in isolation, this application processes text while maintaining the **full document context**, ensuring consistent tone and terminology throughout. 

It features an automatic **back-translation verification** step, converting the translated text back to the original language so users can immediately spot discrepancies or loss of meaning, and an optional **AI Quality Evaluation** to provide a linguistic audit.

## 🌟 Key Features

*   **Context-Aware Translation:** Feeds the full document context to the AI for every segment, ensuring pronouns, tone, and specific terms remain consistent.
*   **Sequential History Injection:** As translation progresses, the app feeds the *Translation So Far* back into the model to ensure continuity in terminology and style across segments.
*   **AI Quality Evaluation:** An optional "Linguistics Expert" mode that audits the translation against the original and back-translation, identifying unclarities, inconsistencies, or awkward phrasing.
*   **Token Usage Estimator & Safety Limit:** Real-time calculation of token costs with a **5,000 token limit** per run to prevent excessive API usage. The UI visualizes the cost difference between standard translation and context-heavy segmentation.
*   **Flexible Segmentation:** Choose how to split your text:
    *   **No Segmentation (Default):** Translates the entire text in one go. Most efficient for texts under the token limit.
    *   **Paragraphs:** Best for articles and essays to preserve flow.
    *   **Sentences:** For high-precision granular translation.
    *   **Line Breaks:** Ideal for poetry, lyrics, or lists.
    *   **Smart Grouping:** Balances context and speed by grouping sentences (~500 chars).
*   **Back-Translation Verification:** Automatically translates the result back to the source language (literally) to verify accuracy.
*   **Transparency:** Inspect the exact prompt sent to the AI for each segment to understand how context was used.
*   **Model Selection:** Choose between **Gemini 3 Flash** (Fast) or **Gemini 3 Pro** (High Quality) for translation, verification, and evaluation steps.
*   **Custom Instructions:** "Fine-tune" the translation by providing specific instructions (e.g., "Use formal legal terminology," "Translate for a 5-year-old," "Keep it witty").
*   **Collapsible UI:** Maximize your reading space by collapsing the input sidebar to focus entirely on the translation results.
*   **Robust Error Handling:** Includes automatic retries for API rate limits to ensure smooth processing of long documents.

## 🛠️ How It Works

1.  **Input:** The user pastes a block of text and selects Source/Target languages.
2.  **Configuration:** Select a **Segmentation Strategy** (Default: No Segmentation) to define how the text is processed.
3.  **Cost Estimation:** The app calculates the estimated token usage based on the strategy. Contextual segmentation increases token usage because the full context is resent for every segment.
4.  **Processing:**
    *   **Full Context:** The prompt includes the *Full Original Document*.
    *   **Translation History:** The prompt includes the *Accumulated Translation* generated so far (if segmented).
    *   **Target:** The specific segment (or full text) to be translated.
5.  **Verification:**
    *   The translated output is sent to a secondary model (or the same one) with instructions to perform a literal back-translation.
6.  **Evaluation (Optional):**
    *   If enabled, the AI acts as a linguistics auditor. It reviews the Original, Translation, and Back-Translation to generate a text report highlighting specific issues or confirming quality.
7.  **Display:** The UI displays the Original, Translated, and Back-Translated text side-by-side, with the evaluation report at the bottom of the card.

## 🚀 Getting Started

### Prerequisites

*   A **Google Gemini API Key**. You can get one from [Google AI Studio](https://aistudio.google.com/).
*   Node.js installed (if running locally).

### Installation & Setup

1.  **Clone the repository** (or download source files):
    ```bash
    git clone <repository-url>
    cd context-verified-translate
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Configuration:**
    *   The application requires the `API_KEY` to be available in `process.env`.
    *   Create a `.env` file in the root directory:
        ```
        API_KEY=your_gemini_api_key_here
        ```
    *   *Note: If using a bundler like Vite/Parcel, ensure the variable is exposed correctly (e.g., `VITE_API_KEY` or configured via define plugins).*

4.  **Run the Application:**
    ```bash
    npm start
    # or
    npm run dev
    ```

## 📖 Usage Guide

1.  **Enter Text:** Paste the content you want to translate into the main text area.
2.  **Select Languages:** Choose your Source and Target languages. Use "Other / Custom" to type in a specific dialect or less common language.
3.  **Monitor Usage:** Watch the token bar at the bottom of the sidebar. If it exceeds 5k tokens, switch to "No Segmentation" or shorten your text.
4.  **Configure Options:**
    *   **Enable AI Quality Evaluation:** Check this box if you want a detailed critique of the translation (uses more tokens).
    *   **Segmentation:** Choose how to split the text based on your needs.
5.  **Advanced Settings (Optional):**
    *   Click the **Sliders Icon** next to the Translate button.
    *   Select your desired **Translation Model** (Pro is better for complex nuances, Flash is faster).
    *   Select your **Verification Model**.
    *   Add **Custom Instructions** (e.g., "Maintain a poetic rhyme scheme").
6.  **Translate:** Click **Translate**.
7.  **Review:**
    *   **Collapsing Sidebar:** Click the menu icon in the top left of the results panel to hide the input area and expand the results view.
    *   **Center Column:** Your translated text.
    *   **Right Column:** The back-translation.
    *   **Bottom Section:** If enabled, read the **Quality Evaluation** report for linguistic insights.
    *   **Info Icon:** Click the small "i" or info icon on a card to see the prompt prompt used for that specific segment.

## 🏗️ Technologies Used

*   **Frontend:** React 19, TypeScript
*   **Styling:** Tailwind CSS
*   **AI SDK:** `@google/genai` (Gemini API)
*   **Models:** Gemini 3 Flash Preview, Gemini 3 Pro Preview

## 📄 License

This project is open-source and available under the MIT License.