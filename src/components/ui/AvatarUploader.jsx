import { useRef, useState, useEffect } from 'react'
import { Camera, Trash2, Loader2 } from 'lucide-react'
import Avatar from './Avatar'
import { storageService } from '../../services/storageService'
import { userService } from '../../services/userService'
import { useAuth } from '../../context/AuthContext'
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE } from '../../utils/constants'
import toast from 'react-hot-toast'

/**
 * Inline avatar editor.
 *
 * Uses an optimistic preview (URL.createObjectURL) so the new photo appears
 * the instant the user picks it, then swaps in the uploaded public URL.
 * Without this, the avatar appears empty until the upload + DB roundtrip
 * completes — which made it look like the photo "didn't take" on first
 * paint.
 */
export default function AvatarUploader({ user, profile, onChange }) {
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [removing, setRemoving] = useState(false)
  // Optimistic preview shown immediately after the user picks a file,
  // overriding profile.avatar_url until the real URL lands.
  const [previewUrl, setPreviewUrl] = useState(null)
  const { updateProfileLocal } = useAuth()

  // Clean up object URLs when they're swapped out / on unmount
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }
  }, [previewUrl])

  const handleFile = async (file) => {
    if (!file) return
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return toast.error('Use JPG, PNG, or WebP.')
    }
    if (file.size > MAX_FILE_SIZE) {
      return toast.error('Max 5 MB. Pick a smaller image.')
    }

    // 1) Optimistic preview — paints immediately
    const localUrl = URL.createObjectURL(file)
    setPreviewUrl(localUrl)
    updateProfileLocal?.({ avatar_url: localUrl })

    try {
      setBusy(true)
      const url = await storageService.uploadAvatar(file, user.id)
      await userService.setAvatarUrl(user.id, url)
      // 2) Replace preview with the real URL in context cache
      updateProfileLocal?.({ avatar_url: url })
      onChange?.(url)
      toast.success('Profile photo updated')
    } catch (err) {
      console.error(err)
      // Roll back the optimistic update on failure
      updateProfileLocal?.({ avatar_url: profile?.avatar_url ?? null })
      setPreviewUrl(null)
      toast.error(err.message || 'Failed to upload photo')
    } finally {
      setBusy(false)
    }
  }

  const handleRemove = async () => {
    const prev = profile?.avatar_url
    // Optimistic
    updateProfileLocal?.({ avatar_url: null })
    setPreviewUrl(null)
    try {
      setRemoving(true)
      await storageService.deleteAvatar(user.id)
      await userService.setAvatarUrl(user.id, null)
      onChange?.(null)
      toast.success('Profile photo removed')
    } catch (err) {
      console.error(err)
      updateProfileLocal?.({ avatar_url: prev })
      toast.error(err.message || 'Failed to remove photo')
    } finally {
      setRemoving(false)
    }
  }

  const displayedUrl = previewUrl || profile?.avatar_url

  return (
    <div className="flex items-center gap-5">
      <div className="relative">
        <Avatar
          url={displayedUrl}
          name={profile?.name}
          email={user?.email}
          size="xl"
          square
        />
        {(busy || removing) && (
          <div className="absolute inset-0 rounded-3xl bg-black/55 flex items-center justify-center">
            <Loader2 size={22} className="text-white animate-spin" />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            handleFile(f)
            e.target.value = ''
          }}
        />
        <button
          type="button"
          className="btn-pink text-xs"
          disabled={busy || removing}
          onClick={() => inputRef.current?.click()}
        >
          <Camera size={13} /> {displayedUrl ? 'Change photo' : 'Upload photo'}
        </button>
        {displayedUrl && (
          <button
            type="button"
            className="btn-ghost text-xs ml-2"
            disabled={busy || removing}
            onClick={handleRemove}
          >
            <Trash2 size={13} /> Remove
          </button>
        )}
        <p className="text-xs text-gray-500">JPG, PNG or WebP · max 5 MB</p>
      </div>
    </div>
  )
}
