type UppercaseType<T extends string> = T extends `${infer F}-${infer L}`
  ? `${Uppercase<F>}_${UppercaseType<L>}`
  : Uppercase<T>

type UppercaseArray<T extends unknown[]> = {
  [K in keyof T]: T[K] extends string ? UppercaseType<T[K]> : T[K]
}

export type DomClassesType<T extends readonly unknown[] = []> = {
  [K in UppercaseArray<T>[number]]: K
}
