import React, { useState } from 'react';
import { X, Plus, Search, CheckCircle2, Image as ImageIcon, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRef } from 'react';
import { compressImageFile } from '../../utils/imageCompressor';

interface MediaLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  allImages: string[];
}

export default function MediaLibrary({ isOpen, onClose, onSelect, allImages }: MediaLibraryProps) {
  const [search, setSearch] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredImages = allImages.filter(img => 
    img.toLowerCase().includes(search.toLowerCase())
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, {
          maxWidth: 1000,
          maxHeight: 1000,
          quality: 0.75,
          maxSizeBytes: 150 * 1024
        });
        onSelect(compressed);
      } catch (err) {
        alert('ইমেজ প্রসেসিং ব্যর্থ হয়েছে');
      }
    }
  };

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUrl.trim()) {
      onSelect(newUrl.trim());
      setNewUrl('');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white dark:bg-neutral-950 w-full max-w-4xl h-[80vh] rounded-[2.5rem] overflow-hidden flex flex-col relative z-10 shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-neutral-100 dark:border-neutral-900 flex items-center justify-between bg-white dark:bg-neutral-950 sticky top-0">
              <div>
                <h3 className="text-xl md:text-2xl font-black text-neutral-900 dark:text-white">মিডিয়া লাইব্রেরি</h3>
                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1">Select an existing image or enter a new URL</p>
              </div>
              <button 
                onClick={onClose}
                className="p-3 bg-neutral-100 dark:bg-neutral-900 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 rounded-2xl transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-6 md:p-8 space-y-8">
              {/* Add New URL & Upload */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <form onSubmit={handleAddUrl} className="space-y-4">
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">নতুন ছবির লিঙ্ক দিন</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="flex-grow px-6 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border-none font-bold text-sm focus:ring-4 focus:ring-primary/10"
                    />
                    <button 
                      type="submit"
                      className="bg-primary text-white px-6 py-4 rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-xs whitespace-nowrap"
                    >
                      Add
                    </button>
                  </div>
                </form>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">গ্যালারি থেকে আপলোড করুন</label>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border-2 border-dashed border-neutral-200 dark:border-neutral-800 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                  >
                    <Upload size={20} className="text-neutral-400 group-hover:text-primary transition-colors" />
                    <span className="font-black text-sm text-neutral-600 dark:text-neutral-400 group-hover:text-primary">ফাইল নির্বাচন করুন</span>
                  </button>
                </div>
              </div>

              {/* Search & Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">রিসেট মিডিয়া ({filteredImages.length})</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                    <input 
                      type="text" 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search images..."
                      className="pl-12 pr-6 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border-none text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => onSelect(img)}
                      className="group relative aspect-square rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 hover:ring-4 hover:ring-primary/50 transition-all border border-neutral-100 dark:border-neutral-900"
                    >
                      <img src={img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                      <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <CheckCircle2 className="text-white" size={32} />
                      </div>
                    </button>
                  ))}
                  
                  {filteredImages.length === 0 && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-neutral-400 bg-neutral-50 dark:bg-neutral-900 rounded-[2.5rem] border-2 border-dashed border-neutral-200 dark:border-neutral-800">
                      <ImageIcon size={48} strokeWidth={1} className="mb-4 opacity-20" />
                      <p className="font-bold">No images found</p>
                      <p className="text-xs">Try a different search or add a new URL above</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
