# Contextual Verified Translate (LinguaCheck)

A high-precision, AI-powered translation tool designed for accuracy and nuance. Unlike standard translation services that often translate sentences in isolation, this application processes text in logical chunks while maintaining the **full document context**, ensuring consistent tone and terminology throughout. 

It features an automatic **back-translation verification** step, converting the translated text back to the original language so users can immediately spot discrepancies or loss of meaning.

## 🌟 Key Features

*   **Context-Aware Translation:** Splits long texts into segments but feeds the full document context to the AI for every segment, ensuring pronouns, tone, and specific terms remain consistent.
*   **Back-Translation Verification:** Automatically translates the result back to the source language (literally) to verify accuracy.
*   **Model Selection:** Choose between **Gemini 3 Flash** (Fast) or **Gemini 3 Pro** (High Quality) for both translation and verification steps.
*   **Custom Instructions:** "Fine-tune" the translation by providing specific instructions (e.g., "Use formal legal terminology," "Translate for a 5-year-old," "Keep it witty").
*   **Collapsible UI:** Maximize your reading space by collapsing the input sidebar to focus entirely on the translation results.
*   **Flexible Language Support:** Built-in presets for major languages plus a **Custom** option to specify any language supported by Gemini.
*   **Sequential Processing:** Visual feedback showing the translation process segment-by-segment.

## 🛠️ How It Works

1.  **Input:** The user pastes a block of text and selects Source/Target languages.
2.  **Chunking:** The application splits the text into logical paragraphs or segments to manage API limits and provide granular feedback.
3.  **Context Injection:**
    *   For *Segment A*, the prompt includes *Segment A* + *Full Document Text*.
    *   The model is instructed to translate *only* Segment A while using the rest for context.
4.  **Verification:**
    *   The translated output is sent to a secondary model (or the same one) with instructions to perform a literal back-translation.
5.  **Display:** The UI displays the Original, Translated, and Back-Translated text side-by-side for easy comparison.

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
3.  **Advanced Settings (Optional):**
    *   Click the **Sliders Icon** next to the Translate button.
    *   Select your desired **Translation Model** (Pro is better for complex nuances, Flash is faster).
    *   Select your **Verification Model**.
    *   Add **Custom Instructions** (e.g., "Maintain a poetic rhyme scheme").
4.  **Translate:** Click **Translate**. The app will process the text paragraph by paragraph.
5.  **Review:**
    *   **Collapsing Sidebar:** Click the menu icon in the top left of the results panel to hide the input area and expand the results view.
    *   **Center Column:** Your translated text.
    *   **Right Column:** The back-translation. Read this to ensure the meaning matches your original intent.

## 🏗️ Technologies Used

*   **Frontend:** React 19, TypeScript
*   **Styling:** Tailwind CSS
*   **AI SDK:** `@google/genai` (Gemini API)
*   **Models:** Gemini 3 Flash Preview, Gemini 3 Pro Preview

## 📄 License

This project is open-source and available under the MIT License.
