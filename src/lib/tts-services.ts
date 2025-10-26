// Example integration with ElevenLabs API
// This is a demonstration - you'd need an API key and proper error handling

export async function generateElevenLabsAudio(text: string, voiceId?: string) {
  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
  const VOICE_ID = voiceId || '21m00Tcm4TlvDq8ikWAM'; // Default voice
  
  if (!ELEVENLABS_API_KEY) {
    throw new Error('ElevenLabs API key not configured');
  }

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.status}`);
  }

  return response.blob();
}

// Example integration with OpenAI TTS
export async function generateOpenAIAudio(text: string, voice: string = 'alloy') {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice: voice, // alloy, echo, fable, onyx, nova, shimmer
      response_format: 'mp3',
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  return response.blob();
}

// Example usage in API route:
/*
// /src/app/api/tts-premium/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateElevenLabsAudio, generateOpenAIAudio } from '@/lib/tts-services';

export async function POST(request: NextRequest) {
  try {
    const { text, service = 'openai', voice } = await request.json();
    
    let audioBlob: Blob;
    
    switch (service) {
      case 'elevenlabs':
        audioBlob = await generateElevenLabsAudio(text, voice);
        break;
      case 'openai':
        audioBlob = await generateOpenAIAudio(text, voice);
        break;
      default:
        return NextResponse.json({ error: 'Unsupported service' }, { status: 400 });
    }

    const buffer = await audioBlob.arrayBuffer();
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="tts-${Date.now()}.mp3"`,
      },
    });
  } catch (error) {
    console.error('TTS Error:', error);
    return NextResponse.json({ error: 'TTS generation failed' }, { status: 500 });
  }
}
*/