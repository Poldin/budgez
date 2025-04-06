'use client'

import { useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Video } from 'lucide-react'
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface VideoMetadata {
  url?: string
  videoType?: 'youtube' | 'vimeo' | 'loom'
}

interface VideoData {
  content: string
  metadata?: VideoMetadata
}

interface VideoBlockProps {
  block: {
    id: string
    content: string
    alignment: 'left' | 'center' | 'right'
    metadata?: VideoMetadata
  }
  onChange: (data: VideoData) => void
}

export default function VideoBlock({ block, onChange }: VideoBlockProps) {
  const [isEditing, setIsEditing] = useState(!block.metadata?.url)
  const [url, setUrl] = useState(block.metadata?.url || '')
  const [videoType, setVideoType] = useState<'youtube' | 'vimeo' | 'loom'>(
    block.metadata?.videoType || 'youtube'
  )
  
  useEffect(() => {
    if (url) {
      
    }
  }, [url, videoType])

  const getAlignmentClasses = (alignment: string) => {
    switch (alignment) {
      case 'left': return 'ml-0 mr-auto';
      case 'center': return 'mx-auto';
      case 'right': return 'ml-auto mr-0';
      default: return 'mx-auto';
    }
  }

  const getEmbedUrl = (url: string, type: 'youtube' | 'vimeo' | 'loom'): string => {
    try {
      if (type === 'youtube') {
        // Handle various YouTube URL formats
        const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
        const match = url.match(youtubeRegex)
        if (match && match[1]) {
          return `https://www.youtube.com/embed/${match[1]}`
        }
      } else if (type === 'vimeo') {
        // Handle Vimeo URLs
        const vimeoRegex = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|)(\d+)(?:$|\/|\?)/
        const match = url.match(vimeoRegex)
        if (match && match[1]) {
          return `https://player.vimeo.com/video/${match[1]}`
        }
      } else if (type === 'loom') {
        // Handle Loom URLs
        const loomRegex = /loom\.com\/share\/([a-f0-9]+)/
        const match = url.match(loomRegex)
        if (match && match[1]) {
          return `https://www.loom.com/embed/${match[1]}`
        }
      }
    } catch (error) {
      console.error('Error parsing video URL', error)
    }
    
    return url // Return original URL if parsing fails
  }

  const handleSave = () => {
    onChange({
      content: url,
      metadata: {
        ...block.metadata,
        url,
        videoType
      }
    })
    
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="p-4 rounded-md border border-gray-200 w-full">
        <div className="space-y-4">
          <div>
            <Label htmlFor={`video-type-${block.id}`}>Video Type</Label>
            <Select 
              value={videoType} 
              onValueChange={(value: 'youtube' | 'vimeo' | 'loom') => setVideoType(value)}
            >
              <SelectTrigger id={`video-type-${block.id}`} className="mt-1">
                <SelectValue placeholder="Select video type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="vimeo">Vimeo</SelectItem>
                <SelectItem value="loom">Loom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor={`video-url-${block.id}`}>Video URL</Label>
            <Input
              id={`video-url-${block.id}`}
              type="text"
              placeholder={
                videoType === 'youtube' 
                  ? 'https://www.youtube.com/watch?v=VIDEO_ID' 
                  : videoType === 'vimeo' 
                    ? 'https://vimeo.com/VIDEO_ID' 
                    : 'https://www.loom.com/share/VIDEO_ID'
              }
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!block.metadata?.url) {
    return (
      <div 
        className="p-8 border border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 w-full" 
        onClick={() => setIsEditing(true)}
      >
        <Video className="h-8 w-8 text-gray-400 mb-2" />
        <div className="text-sm text-gray-500">Click to add a video</div>
      </div>
    )
  }

  const finalEmbedUrl = block.metadata.url ? getEmbedUrl(block.metadata.url, block.metadata.videoType || 'youtube') : '';
  const videoProvider = block.metadata.videoType || 'youtube';
  const videoTitle = `${videoProvider} video`;

  return (
    <div className="relative group">
      <div className={`w-full max-w-3xl ${getAlignmentClasses(block.alignment)}`}>
        <div className="relative pb-[56.25%] h-0 overflow-hidden rounded">
          <iframe 
            src={finalEmbedUrl}
            className="absolute top-0 left-0 w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={videoTitle}
            aria-label={videoTitle}
          />
        </div>
      </div>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <Button
          size="sm"
          variant="secondary"
          className="bg-white/80 backdrop-blur-sm"
          onClick={() => setIsEditing(true)}
        >
          Edit
        </Button>
      </div>
    </div>
  )
} 