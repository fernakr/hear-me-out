import QRCodeGenerator from "@/components/QRCodeGenerator";
import TextToSpeech from "@/components/TextToSpeech";
import TextToSpeechAdvanced from "@/components/TextToSpeechAdvanced";
import ClientSideTTS from "@/components/ClientSideTTS";

export default function FinalPage() {
  const sampleText = "You are capable of amazing things. Trust yourself and take that next step forward.";
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Create Audio Message
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Generate QR codes and audio files from your encouraging message
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* QR Code Generator */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
              Share via QR Code
            </h2>
            <QRCodeGenerator text={sampleText} />
          </div>

      

          {/* Advanced TTS with Recording */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
              Alternative Recording Method
            </h2>
            <TextToSpeechAdvanced text={sampleText} />
          </div>
        </div>

        {/* Information Section */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            How to Create MP3/MP4 Files
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                🎵 Client-Side (Browser)
              </h4>
              <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Web Speech API (real-time)</li>
                <li>• MediaRecorder API (capture)</li>
                <li>• Limited voice options</li>
                <li>• Free but basic quality</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                🏗️ Server-Side APIs
              </h4>
              <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Google Cloud TTS</li>
                <li>• AWS Polly</li>
                <li>• Azure Speech Services</li>
                <li>• High quality, many voices</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                🚀 Premium Services
              </h4>
              <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                <li>• ElevenLabs (ultra-realistic)</li>
                <li>• OpenAI TTS API</li>
                <li>• Murf.ai</li>
                <li>• Human-like quality</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>💡 Tip:</strong> For your "hear-me-out" app concept, I recommend starting with the browser TTS for prototyping, 
              then integrating ElevenLabs or Google Cloud TTS for production-quality voice messages that friends can easily share.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
