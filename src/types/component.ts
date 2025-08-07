import type { HTMLAttributes } from 'astro/types'

export interface ButtonAttr extends HTMLAttributes<a> {
  variant?:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'info'
    | 'success'
    | 'warning'
    | 'error'
    //  | 'link'
    | 'icon'
  text?: string
  icon?: string
  isIconRight?: boolean | string
  classes?: Record<string, string>
  type?: 'button' | 'submit' | 'reset' | 'link'
}
