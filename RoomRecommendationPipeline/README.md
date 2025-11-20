# Room Recommendation Pipeline

A Next.js application that processes room images through GPT-Vision, an Autoregressive Transformer model, and GPT-4 to generate room layout and design recommendations. The transformer predicts next objects and their 3D positions (x, y, z) in the scene, which GPT-4 then interprets to provide visual recommendations.

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
2. Enter your Autoregressive Transformer model endpoint (or use the one from `.env.local`)
3. Upload a room image
4. Click "Process Image" to run the pipeline
5. View the recommendations

## Environment Variables

- `NEXT_PUBLIC_OPENAI_API_KEY`: Your OpenAI API key (required)
- `NEXT_PUBLIC_TRANSFORMER_ENDPOINT`: Your Autoregressive Transformer model API endpoint (required)

## Pipeline Flow

1. **GPT-Vision**: Analyzes the uploaded room image and provides detailed room description
2. **Autoregressive Transformer**: Takes the room description and predicts next objects with:
   - **Category**: One-hot encoded array or index (e.g., chair=0, table=1, sofa=2, etc.)
   - **Positions**: 3D coordinates (x, y, z) for object placement in the virtual room
3. **GPT-4 Recommendations**: Interprets the transformer predictions and generates visual recommendations like "place a chair here" or "add a table there" based on predicted positions

**Note:** If you set these in `.env.local`, the input fields will be pre-filled and disabled. You can still override them by typing in the fields.

