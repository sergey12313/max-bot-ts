declare module 'vcf' {
  export default class VCF {
    parse(input: string): this;
    get(key: string): { valueOf(): string };
  }
}
