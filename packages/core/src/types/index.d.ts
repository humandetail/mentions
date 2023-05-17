type UppercaseType<T extends string> = T extends `${infer F}-${infer L}`
  ? `${Uppercase<F>}_${UppercaseType<L>}`
  : Uppercase<T>

type UppercaseArray<T extends unknown[]> = {
  [K in keyof T]: T[K] extends string ? UppercaseType<T[K]> : T[K]
}

export type Noop = () => void

export type DomClassesType<T extends readonly unknown[] = []> = {
  [K in UppercaseArray<T>[number]]: K
}

/** innerHTML */
export type HTMLString = string

export type EventType = 'change' | 'close' | 'open'

export interface MentionConstructor {
  mount: (el: string | HTMLElement) => void
  destroy: Noop
  on: (type: EventType, cb: (value: string) => void) => MentionConstructor
  once: (type: EventType, cb: (value: string) => void) => MentionConstructor
  off: (type: EventType, cb: (value: string) => void) => MentionConstructor
  clear: () => MentionConstructor
}
