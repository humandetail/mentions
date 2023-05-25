import type { MentionDropdownListOption } from '../libs/renderer'

type UppercaseType<T extends string> = T extends `${infer F}-${infer L}`
  ? `${Uppercase<F>}_${UppercaseType<L>}`
  : Uppercase<T>

type UppercaseArray<T extends readonly string[]> = {
  [K in keyof T]: T[K] extends string ? UppercaseType<T[K]> : T[K]
}

export type Noop = () => void

export type DomClassesType<T extends readonly string[] = []> = {
  [K in UppercaseArray<T>[number]]: K
}

/** innerHTML */
export type HTMLString = string

export type EventType = 'change' | 'close' | 'open' | 'mentions-change'

interface Listener {
  (type: 'mentions-change', cb: (newMentions: MentionDropdownListOption[], oldMentions: MentionDropdownListOption[]) => void): MentionConstructor
  (type: 'change', cb: (newValue: string, oldValue?: string) => void): MentionConstructor
  (type: 'close', cb: Noop): MentionConstructor
  (type: 'open', cb: Noop): MentionConstructor
}

export interface MentionConstructor {
  mount: (el: string | HTMLElement) => void
  destroy: Noop
  set: {
    (key: 'value', value: string): MentionConstructor
    (key: 'options', value: MentionDropdownListOption[]): MentionConstructor
    (key: 'max-length', value: number): MentionConstructor
  }
  on: Listener
  once: Listener
  off: Listener
  clear: () => MentionConstructor
}
