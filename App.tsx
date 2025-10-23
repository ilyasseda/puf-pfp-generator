import React, { useState, useCallback, useRef } from 'react';
import { editImageWithPrompt } from './services/geminiService';
import type { ImageFile } from './types';
import { UploadIcon, SparklesIcon, LoadingSpinner } from './components/icons';

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const Header: React.FC = () => (
  <header className="w-full p-4 border-b border-gray-800 flex items-center justify-center">
    <SparklesIcon className="w-8 h-8 text-gray-400 mr-3" />
    <h1 className="text-3xl font-bold text-gray-200">
      PUF PFP Generator
    </h1>
  </header>
);

const ImageUpload: React.FC<{ onImageUpload: (image: ImageFile) => void }> = ({ onImageUpload }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const dataUri = await fileToDataUri(file);
            const base64 = dataUri.split(',')[1];
            onImageUpload({ file, base64 });
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div 
            className="w-full h-64 border-2 border-dashed border-gray-700 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-gray-600 hover:text-gray-400 transition-colors cursor-pointer"
            onClick={handleClick}
        >
            <UploadIcon className="w-12 h-12 mb-2" />
            <p className="font-semibold">Click to upload an image</p>
            <p className="text-sm">PNG, JPG, WEBP</p>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileChange}
            />
        </div>
    );
};

const ImageDisplay: React.FC<{ src: string; alt: string; children?: React.ReactNode }> = ({ src, alt, children }) => (
    <div className="relative w-full h-full bg-black/50 rounded-lg overflow-hidden flex items-center justify-center">
        <img src={src} alt={alt} className="object-contain w-full h-full" />
        {children}
    </div>
);

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<ImageFile | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedAccessory, setGeneratedAccessory] = useState<string | null>(null);


  const handleImageUpload = useCallback((image: ImageFile) => {
    setOriginalImage(image);
    setEditedImage(null);
    setError(null);
    setGeneratedAccessory(null);
  }, []);

  const handleGenerate = async () => {
    if (!originalImage) {
      setError("Please upload an image first.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setEditedImage(null);
    setGeneratedAccessory(null);

    try {
      const filterPrompt = "Apply a cool, black and white security camera filter with a slight fish-eye lens effect to the image.";
      const accessoryPrompt = "Overlay a stylish chain with the letters 'PUF' on it. The chain should be appropriately placed on the main subject of the image, whether it's a person, animal, or object.";
      const accessoryType = "PUF Chain";
      
      const prompt = `${filterPrompt} ${accessoryPrompt}`;

      const resultBase64 = await editImageWithPrompt(
        originalImage.base64,
        originalImage.file.type,
        prompt
      );
      setEditedImage(`data:image/png;base64,${resultBase64}`);
      setGeneratedAccessory(accessoryType);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center">
      <Header />
      <main className="w-full max-w-7xl flex-grow p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Controls Column */}
        <div className="flex flex-col gap-6 p-6 bg-gray-900 rounded-xl shadow-lg">
            <div>
                <h2 className="text-xl font-semibold mb-3 text-gray-300">1. Upload your photo</h2>
                {!originalImage ? (
                    <ImageUpload onImageUpload={handleImageUpload} />
                ) : (
                    <div className="w-full aspect-square">
                        <ImageDisplay src={`data:${originalImage.file.type};base64,${originalImage.base64}`} alt="Original"/>
                    </div>
                )}
            </div>
            {originalImage && (
                 <div>
                    <h2 className="text-xl font-semibold mb-3 text-gray-300">2. Generate PFP</h2>
                    <p className="text-gray-400 mb-4">Click below to apply a security camera filter and add a custom chain.</p>
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 bg-white text-black font-bold py-3 px-4 rounded-lg hover:bg-gray-200 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-500"
                    >
                        {isLoading ? (
                        <>
                            <LoadingSpinner />
                            Generating...
                        </>
                        ) : (
                        <>
                            <SparklesIcon className="w-5 h-5" />
                            Generate PFP
                        </>
                        )}
                    </button>
                </div>
            )}
        </div>

        {/* Output Column */}
        <div className="flex flex-col p-6 bg-gray-900 rounded-xl shadow-lg items-center justify-center">
            <h2 className="text-xl font-semibold mb-3 text-gray-300 self-start">3. Your result</h2>
            <div className="w-full aspect-square flex items-center justify-center bg-black/50 rounded-lg">
                {isLoading && (
                     <div className="flex flex-col items-center text-gray-400">
                        <LoadingSpinner />
                        <p className="mt-2">Editing your image...</p>
                    </div>
                )}
                {error && <p className="text-red-400 text-center p-4">{error}</p>}
                {editedImage && (
                    <ImageDisplay src={editedImage} alt="Edited">
                        {generatedAccessory && (
                            <div className="absolute bottom-2 right-2 px-2 py-1 bg-black bg-opacity-50 rounded text-xs font-mono backdrop-blur-sm">
                                {generatedAccessory}
                            </div>
                        )}
                    </ImageDisplay>
                )}
                {!isLoading && !error && !editedImage && (
                    <div className="text-center text-gray-500">
                        <SparklesIcon className="w-16 h-16 mx-auto mb-4" />
                        <p>Your generated PFP will appear here.</p>
                    </div>
                )}
            </div>
        </div>
      </main>
    </div>
  );
};

export default App;
