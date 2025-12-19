declare module '*/package.json' {
  export interface PackageJson {
    name: string;
    version: string;
    [key: string]: unknown;
  }

  const value: PackageJson;
  export default value;
}
