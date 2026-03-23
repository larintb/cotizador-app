declare module '@/lib/customsValues' {
  export function lookupCustomsValue(
    make: string,
    model: string,
    year: string,
    cylinders: string,
  ): { value: number; source: string } | null
}
