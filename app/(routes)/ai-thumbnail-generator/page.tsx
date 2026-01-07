"use client"

import { RunStatus } from '@/services/GlobalApi';
import axios from 'axios';
import { ArrowUp, ImagePlus, Loader2, User, X } from 'lucide-react'
import Image from 'next/image';
import React, { useEffect, useState } from 'react'

function AiThumbnailGenerator() {
  const [userInput, setUserInput] = useState<string>("");
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [faceImage, setFaceImage] = useState<File | null>(null);
  const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null);
  const [faceImagePreview, setFaceImagePreview] = useState<string | null>(null);
  const [loading,setLoading]=useState(false);
  const [outputThumbnailImage,setOutputThumbnailImage]=useState('');

  const onHandleFileChange = (field: string, e: any) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (field === 'referenceImage') {
      // store the File in state and use an object URL for preview (string)
      setReferenceImage(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      // revoke previous preview handled in effect below
      setReferenceImagePreview(url);
    } else {
      setFaceImage(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setFaceImagePreview(url);
    }
  }

  // cleanup object URL for reference preview
  useEffect(() => {
    return () => {
      if (referenceImagePreview) {
        URL.revokeObjectURL(referenceImagePreview);
      }
    }
  }, [referenceImagePreview]);

  // cleanup object URL for face preview
  useEffect(() => {
    return () => {
      if (faceImagePreview) {
        URL.revokeObjectURL(faceImagePreview);
      }
    }
  }, [faceImagePreview]);

 const onSubmit = async () => {
    setLoading(true);
    const formData = new FormData();
    userInput && formData.append('userInput', userInput);
    referenceImage && formData.append('refImage', referenceImage);
    faceImage && formData.append('faceImage', faceImage);

    try {
      // 1. Send the request
      const result = await axios.post('/api/generate-thumbnail', formData);
      console.log("Triggered Run ID:", result.data.runId);

      // 2. Poll for results
      const runId = result.data.runId;
      
      while (true) {
        // We get the array directly because GlobalApi returns json.data
        const runStatusArray = await RunStatus(runId); 
        
        // Safety check: Ensure we have data
        if (runStatusArray && runStatusArray.length > 0) {
          const status = runStatusArray[0].status;
          
          if (status === 'Completed') {
            const output = runStatusArray[0].output;
            
            // 🔴 THIS IS THE FIX 🔴
            // The output is { success: true, imageUrl: "..." }
            // You MUST extract .imageUrl
            console.log("Generation Success:", output.imageUrl); 
            setOutputThumbnailImage(output.imageUrl); 
            
            setLoading(false);
            break;
          }
          
          if (status === 'Failed' || status === 'Cancelled') {
            console.error("Generation Failed");
            setLoading(false);
            break;
          }
        }

        // Wait 2 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (e) {
      console.error("Error submitting:", e);
      setLoading(false);
    }
  }
  return (
    <div>
      <div className='px-10 md:px:20 lg:px-40'>
        <div className='flex items-center justify-center flex-col mt-20 gap-2'>
          <h1 className="font-bold text-3xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-red-800 via-red-400 to-red-200">
            AI Thumbnail Generator
          </h1>

          <p className='text-gray-400 text-center'>Turn any video into a click magnet with thumbnails that grab attention and drive views. Our AI YouTube thumbnail maker creates professional designs instantly — no designing skills needed.</p>
        </div>
        <div>
          {loading?<div className='w-full bg-secondary border rounded-2xl p-10 h-[250px] mt-6 flex items-center justify-center'>
            <Loader2 className='animate-spin' />
            <h2>Please Wait... Thumbnail is generating</h2>
          </div>:
              <div>
              {outputThumbnailImage && <Image src={outputThumbnailImage} alt='Thumbnail'
              width={500}
              height={400}
              className='aspect-video w-full'
              />}
              </div>
          }
        </div>


        <div className='flex gap-5 items-center p-3 border rounded-xl mt-10 bg-secondary'>
          <textarea
            placeholder='Enter your youtube video title or description'
            className='w-full outline-none bg-secondary'
            value={userInput}
            onChange={(event) => setUserInput(event.target.value)}
          />
          <div className='p-3 bg-gradient-to-t from-red-500 to-orange-500 rounded-full cursor-pointer'
          onClick={onSubmit}
          >
            <ArrowUp />
          </div>
        </div>

        <div className='flex gap-5 mt-10'>
          <label htmlFor='referenceImageUpload' className='w-full'>
            {!referenceImagePreview ? (
              <div className='p-4 w-full border rounded-xl bg-secondary flex gap-2 items-center justify-center hover:scale-105 transition-all cursor-pointer'>
                <ImagePlus />
                <h2>Reference Image</h2>
              </div>
            ) : (
              // only render Image when we have a valid preview URL string
              <div className='relative'>
                <X className='absolute' onClick={()=>setReferenceImagePreview(null)}/>
              <Image
                src={referenceImagePreview}
                alt='Reference Image'
                width={100}
                height={100}
                className='w-[70px] h-[70px] object-cover rounded-sm'
              />
             </div>
            )}
          </label>
          <input
            type='file'
            id="referenceImageUpload"
            className='hidden'
            accept="image/*"
            onChange={(e) => onHandleFileChange('referenceImage', e)}
          />

          <label htmlFor='includeFace' className='w-full'>
            {!faceImagePreview? (<div className='p-4 w-full border rounded-xl bg-secondary flex gap-2 items-center justify-center hover:scale-105 transition-all cursor-pointer'>
              <User />
              <h2>Include Face</h2>
            </div>):(
              // only render Image when we have a valid preview URL string
              <div className='relative'>
                <X className='absolute' onClick={()=>setFaceImagePreview(null)}/>
              <Image
                src={faceImagePreview}
                alt='face Image'
                width={100}
                height={100}
                className='w-[70px] h-[70px] object-cover rounded-sm'
              />
             </div>
            )}
          </label>
          <input
            type='file'
            id="includeFace"
            className='hidden'
            accept="image/*"
            onChange={(e) => onHandleFileChange('faceImage', e)}
          />
        </div>

      </div>
    </div>
  )
}

export default AiThumbnailGenerator
