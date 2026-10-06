import { forwardRef } from 'react'

const Input = forwardRef(function Input(
  { label, error, helperText, leftIcon, rightIcon, className = '', ...props },
  ref
) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={`
            w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-gray-500
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50
            hover:border-white/20
            disabled:opacity-50 disabled:cursor-not-allowed
            ${leftIcon ? 'pl-11' : ''}
            ${rightIcon ? 'pr-11' : ''}
            ${error
              ? 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500/50'
              : 'border-white/10'
            }
            ${className}
          `}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-red-400 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  )
})

export const Textarea = forwardRef(function Textarea(
  { label, error, helperText, className = '', ...props },
  ref
) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={`
          w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-gray-500
          transition-all duration-200 resize-none
          focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50
          hover:border-white/20
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error
            ? 'border-red-500/50 focus:ring-red-500/30'
            : 'border-white/10'
          }
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-red-400 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  )
})

export const Select = forwardRef(function Select(
  { label, error, helperText, children, className = '', ...props },
  ref
) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={`
          w-full bg-[#1a1a2e] border rounded-xl px-4 py-3 text-white
          transition-all duration-200 cursor-pointer appearance-none
          focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50
          hover:border-white/20
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error
            ? 'border-red-500/50 focus:ring-red-500/30'
            : 'border-white/10'
          }
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="mt-1.5 text-sm text-red-400 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  )
})

export default Input
