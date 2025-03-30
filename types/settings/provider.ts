
type BuiltInProvider  = {
    name: string
    apiKey: string
}
  
type CustomProvider = {
    name: string
    baseUrl: string
    apiKey: string
}
  
type Provider = BuiltInProvider | CustomProvider
export type {Provider, BuiltInProvider, CustomProvider}