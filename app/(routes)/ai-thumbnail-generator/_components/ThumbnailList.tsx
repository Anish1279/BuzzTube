import axios from 'axios';
import React, { useEffect, useState } from 'react'
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

type Thumbnail = {
    id: number,
    thumbnailUrl: string,
    refImage: string,
    userInput: string
}

function ThumbnailList() {
    const [thumbnailList, setThumbnailList] = useState<Thumbnail[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        GetThumbnailList();
    }, [])

    const GetThumbnailList = async () => {
        try {
            setLoading(true);
            const result = await axios.get('/api/generate-thumbnail');
            setThumbnailList(result.data);
            setLoading(false);
        } catch (e) {
            console.error("Failed to fetch thumbnails:", e);
            setLoading(false);
        }
    }

    return (
        <div className='mt-10'>
            <h2 className='my-4 font-bold text-xl'>Previously Generated Thumbnails</h2>
            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mt-6'>
                {/* Check if loading is false */}
                {!loading ? thumbnailList?.map((thumbnail, index) => (
                    <div key={index}>
                        {/* 🔴 FIX: Logic split - Only render Link if URL exists */}
                        {thumbnail.thumbnailUrl ? (
                            <Link href={thumbnail.thumbnailUrl} target='_blank'>
                                <Image
                                    src={thumbnail.thumbnailUrl}
                                    alt={'Generated Thumbnail'}
                                    width={400}
                                    height={400}
                                    className='w-full aspect-video rounded-xl object-cover hover:scale-105 transition-all cursor-pointer'
                                />
                            </Link>
                        ) : (
                            // Fallback: No Link, just a div
                            <div className='w-full aspect-video bg-gray-200 rounded-xl animate-pulse flex items-center justify-center text-gray-500 text-sm'>
                                Processing...
                            </div>
                        )}
                    </div>
                )) : (
                    // Loading Skeletons
                    [1, 2, 3, 4, 5, 6].map((item, index) => (
                        <div className="flex flex-col space-y-3" key={index}>
                            <Skeleton className="h-[150px] w-full rounded-xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[200px]" />
                                <Skeleton className="h-4 w-[150px]" />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default ThumbnailList