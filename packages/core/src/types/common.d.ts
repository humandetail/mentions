type UpercaseType<T extends string> = T extends `${infer F}-${infer L}`
  ? `${Uppercase<F>}_${UpercaseType<L>}`
  : Uppercase<T>

type UppercaseArray<T extends any[]> = {
  [K in keyof T]: T[K] extends string ? UpercaseType<T[K]> : T[K]
}

export type DomClassesType<T extends readonly any[] = []> = {
  [K in UppercaseArray<T>[number]]: K
}
