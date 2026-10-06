import { useState, useRef, useCallback } from 'react'
import { Upload, X, Image, AlertCircle } from 'lucide-react'
import { MAX_IMAGES, MAX_FILE_SIZE, ACCEPTED_IMAGE_TYPES } from '../../utils/constants'

export default function ImageUploader({ images = [], existingUrls = [], onChange, onRemoveExisting }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [errors, setErrors] = useState([])

  const totalCount = images.length + existingUrls.length
  const canAddMore = totalCount < MAX_IMAGES

  const validateFile = (file) => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return `${file.name}: Invalid file type. Use JPG, PNG, or WebP.`
    }
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: File too large. Max 5MB.`
    }
    return null
  }

  const processFiles = useCallback((fileList) => {
    const newErrors = []
    const validFiles = []
    const remaining = MAX_IMAGES - totalCount

    Array.from(fileList).slice(0, remaining).forEach((file) => {
      const err = validateFile(file)
      if (err) {
        newErrors.push(err)
      } else {
        validFiles.push(file)
      }
    })

    setErrors(newErrors)
    if (validFiles.length > 0) {
      onChange([...images, ...validFiles])
    }
  }, [images, totalCount, onChange])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    processFiles(e.dataTransfer.files)
  }, [processFiles])

  const handleFileInput = (e) => {
    processFiles(e.target.files)
    e.target.value = '' // reset so same file can be re-selected
  }

  const removeNew = (index) => {
    const updated = images.filter((_, i) => i !== index)
    onChange(updated)
  }

  const previewUrl = (file) => URL.createObjectURL(file)

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      {canAddMore && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200
            ${dragOver
              ? 'border-purple-500 bg-purple-500/10 scale-[1.01]'
              : 'border-white/15 hover:border-purple-500/50 hover:bg-white/5'
            }
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(',')}
            multiple
            onChange={handleFileInput}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${dragOver ? 'bg-purple-500/30' : 'bg-white/5'}`}>
              <Upload size={22} className={dragOver ? 'text-purple-400' : 'text-gray-400'} />
            </div>
            <div>
              <p className="text-gray-300 text-sm font-medium">
                {dragOver ? 'Drop images here' : 'Drag & drop or click to upload'}
              </p>
              <p className="text-gray-500 text-xs mt-1">
                JPG, PNG, WebP · Max 5MB · Up to {MAX_IMAGES - totalCount} more image{MAX_IMAGES - totalCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 space-y-1">
          {errors.map((err, i) => (
            <p key={i} className="text-red-400 text-xs flex items-center gap-1.5">
              <AlertCircle size={11} /> {err}
            </p>
          ))}
        </div>
      )}

      {/* Preview grid */}
      {(existingUrls.length > 0 || images.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Existing uploaded images */}
          {existingUrls.map((url, index) => (
            <div key={`existing-${index}`} className="relative aspect-square rounded-xl overflow-hidden group">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {onRemoveExisting && (
                  <button
                    type="button"
                    onClick={() => onRemoveExisting(index)}
                    className="w-8 h-8 rounded-full bg-red-500/80 flex items-center justify-center text-white hover:bg-red-500 transition-all"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <div className="absolute bottom-1 right-1">
                <span className="px-1.5 py-0.5 rounded-md bg-black/60 text-white/70 text-xs">Saved</span>
              </div>
            </div>
          ))}

          {/* New files preview */}
          {images.map((file, index) => (
            <div key={`new-${index}`} className="relative aspect-square rounded-xl overflow-hidden group">
              <img src={previewUrl(file)} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => removeNew(index)}
                  className="w-8 h-8 rounded-full bg-red-500/80 flex items-center justify-center text-white hover:bg-red-500 transition-all"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="absolute bottom-1 right-1">
                <span className="px-1.5 py-0.5 rounded-md bg-purple-500/60 text-white/70 text-xs">New</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-gray-600 text-xs">
        {totalCount}/{MAX_IMAGES} images · First image will be used as cover
      </p>
    </div>
  )
}
