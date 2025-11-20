# Room Recommendation Pipeline

A Next.js application that processes room images through GPT-Vision, ATISS model, and GPT-4 to generate room layout and design recommendations.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env.local` file:**
   ```bash
   cp env.example .env.local
   ```

3. **Add your API keys to `.env.local`:**
   ```env
   NEXT_PUBLIC_OPENAI_API_KEY=sk-your-openai-api-key-here
   NEXT_PUBLIC_ATISS_ENDPOINT=https://your-atiss-model-endpoint.com/api
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:3000`

## Usage

1. Enter your OpenAI API key (or use the one from `.env.local`)
2. Enter your ATISS model endpoint (or use the one from `.env.local`)
3. Upload a room image
4. Click "Process Image" to run the pipeline
5. View the recommendations

## Environment Variables

- `NEXT_PUBLIC_OPENAI_API_KEY`: Your OpenAI API key (required)
- `NEXT_PUBLIC_ATISS_ENDPOINT`: Your ATISS model API endpoint (required)

**Note:** If you set these in `.env.local`, the input fields will be pre-filled and disabled. You can still override them by typing in the fields.

